-- Loans feature schema. Apply in the Supabase SQL editor after reviewing the
-- existing Transactions table and its RLS policies. This migration is additive.
create table if not exists public."BankAccounts" (
    "BankAccountID" uuid primary key default gen_random_uuid(),
    "UserID" uuid not null default auth.uid() references auth.users(id) on delete cascade,
    "Name" text not null check (length(trim("Name")) between 1 and 60),
    "Balance" numeric(14,2) not null default 0 check ("Balance" >= 0),
    "created_at" timestamptz not null default now()
);

create table if not exists public."Loans" (
    "LoanID" uuid primary key default gen_random_uuid(),
    "UserID" uuid not null default auth.uid() references auth.users(id) on delete cascade,
    "Name" text not null,
    "Type" text not null,
    "Vendor" text not null,
    "OriginalAmount" numeric(14,2) not null check ("OriginalAmount" > 0),
    "Status" text not null default 'active' check ("Status" in ('active','closed')),
    "created_at" timestamptz not null default now()
);

create table if not exists public."LoanPaymentSchedules" (
    "ScheduleID" uuid primary key default gen_random_uuid(),
    "UserID" uuid not null default auth.uid() references auth.users(id) on delete cascade,
    "LoanID" uuid not null references public."Loans"("LoanID") on delete cascade,
    "DueDate" date not null,
    "AmountDue" numeric(14,2) not null check ("AmountDue" > 0),
    "created_at" timestamptz not null default now(),
    unique ("ScheduleID", "LoanID", "UserID")
);

create table if not exists public."LoanPayments" (
    "PaymentID" uuid primary key default gen_random_uuid(),
    "UserID" uuid not null default auth.uid() references auth.users(id) on delete cascade,
    "LoanID" uuid not null,
    "ScheduleID" uuid not null,
    "BankAccountID" uuid not null references public."BankAccounts"("BankAccountID"),
    "Amount" numeric(14,2) not null check ("Amount" > 0),
    "PaymentDate" date not null default current_date,
    "created_at" timestamptz not null default now(),
    foreign key ("ScheduleID", "LoanID", "UserID") references public."LoanPaymentSchedules"("ScheduleID", "LoanID", "UserID") on delete restrict
);

create index if not exists loan_user_status_idx on public."Loans" ("UserID", "Status");
create index if not exists loan_schedule_user_due_idx on public."LoanPaymentSchedules" ("UserID", "DueDate");
create index if not exists loan_payment_user_idx on public."LoanPayments" ("UserID", "LoanID");

alter table public."Transactions"
    add column if not exists "BankAccountID" uuid references public."BankAccounts"("BankAccountID"),
    add column if not exists "LoanID" uuid references public."Loans"("LoanID"),
    add column if not exists "ScheduleID" uuid references public."LoanPaymentSchedules"("ScheduleID");
-- Loan payments are not associated with either payroll cutoff.
alter table public."Transactions" alter column "Payroll" drop not null;

alter table public."BankAccounts" enable row level security;
alter table public."Loans" enable row level security;
alter table public."LoanPaymentSchedules" enable row level security;
alter table public."LoanPayments" enable row level security;
grant select, insert, update, delete on public."BankAccounts", public."Loans", public."LoanPaymentSchedules" to authenticated;
grant select on public."LoanPayments" to authenticated;

drop policy if exists "Users manage own bank accounts" on public."BankAccounts";
create policy "Users manage own bank accounts" on public."BankAccounts"
    for all using ("UserID" = auth.uid()) with check ("UserID" = auth.uid());
drop policy if exists "Users manage own loans" on public."Loans";
create policy "Users manage own loans" on public."Loans"
    for all using ("UserID" = auth.uid()) with check ("UserID" = auth.uid());
drop policy if exists "Users manage own loan schedules" on public."LoanPaymentSchedules";
create policy "Users manage own loan schedules" on public."LoanPaymentSchedules"
    for all using ("UserID" = auth.uid()) with check ("UserID" = auth.uid());
drop policy if exists "Users view own loan payments" on public."LoanPayments";
create policy "Users view own loan payments" on public."LoanPayments"
    for select using ("UserID" = auth.uid());

-- The only payment write entry point locks the schedule, loan, and account,
-- checks ownership and available balances, then writes both records atomically.
create or replace function public.record_loan_payment(
    p_schedule_id uuid,
    p_bank_account_id uuid,
    p_amount numeric
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_loan public."Loans"%rowtype;
    v_schedule public."LoanPaymentSchedules"%rowtype;
    v_account public."BankAccounts"%rowtype;
    v_installment_paid numeric(14,2);
    v_loan_paid numeric(14,2);
    v_payment_id uuid;
begin
    if v_user_id is null then raise exception 'Authentication required'; end if;
    if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be positive'; end if;

    select * into v_schedule from public."LoanPaymentSchedules"
      where "ScheduleID" = p_schedule_id and "UserID" = v_user_id for update;
    if not found then raise exception 'Payment schedule not found'; end if;
    select * into v_loan from public."Loans"
      where "LoanID" = v_schedule."LoanID" and "UserID" = v_user_id and "Status" = 'active' for update;
    if not found then raise exception 'Active loan not found'; end if;
    select * into v_account from public."BankAccounts"
      where "BankAccountID" = p_bank_account_id and "UserID" = v_user_id for update;
    if not found then raise exception 'Payment account not found'; end if;

    select coalesce(sum("Amount"),0) into v_installment_paid from public."LoanPayments"
      where "ScheduleID" = p_schedule_id and "UserID" = v_user_id;
    select coalesce(sum("Amount"),0) into v_loan_paid from public."LoanPayments"
      where "LoanID" = v_loan."LoanID" and "UserID" = v_user_id;
    if p_amount > v_schedule."AmountDue" - v_installment_paid then raise exception 'Payment exceeds the remaining installment amount'; end if;
    if p_amount > v_loan."OriginalAmount" - v_loan_paid then raise exception 'Payment exceeds the remaining loan balance'; end if;
    if p_amount > v_account."Balance" then raise exception 'Insufficient account balance'; end if;

    insert into public."LoanPayments" ("UserID", "LoanID", "ScheduleID", "BankAccountID", "Amount")
      values (v_user_id, v_loan."LoanID", p_schedule_id, p_bank_account_id, p_amount)
      returning "PaymentID" into v_payment_id;
    update public."BankAccounts" set "Balance" = "Balance" - p_amount where "BankAccountID" = p_bank_account_id;

    insert into public."Transactions" ("UserID", "Date", "Sender", "Amount", "Reciever", "Purpose", "Transaction", "BankAccountID", "LoanID", "ScheduleID")
      values (v_user_id, current_date, v_account."Name", p_amount, v_loan."Vendor",
        'Loan payment: ' || v_loan."Name", 'Loan', p_bank_account_id, v_loan."LoanID", p_schedule_id);

    return v_payment_id;
end;
$$;

revoke all on function public.record_loan_payment(uuid, uuid, numeric) from public;
grant execute on function public.record_loan_payment(uuid, uuid, numeric) to authenticated;

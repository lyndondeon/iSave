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

-- Remove the earlier payment function before adding its safer replacement.
drop function if exists public.record_loan_payment(uuid, uuid, numeric);

-- Extend the applied loan schema without replacing existing loan, schedule,
-- payment, account, or transaction tables.
begin;

-- Historical dates/durations remain unknown when the old schema did not store them.
alter table public."Loans"
    add column if not exists "DateOfLoan" date,
    add column if not exists "DueDay" integer,
    add column if not exists "DurationMonths" integer,
    add column if not exists "MonthlyAmount" numeric(14,2),
    add column if not exists "MonthlyRequired" boolean;

update public."Loans" l
set "DueDay" = coalesce(
        l."DueDay",
        (select extract(day from s."DueDate")::integer
         from public."LoanPaymentSchedules" s
         where s."LoanID" = l."LoanID" and s."UserID" = l."UserID"
         order by s."DueDate", s."ScheduleID" limit 1),
        extract(day from l."DateOfLoan")::integer
    ),
    "DurationMonths" = coalesce(
        l."DurationMonths",
        nullif((select count(*)::integer
                from public."LoanPaymentSchedules" s
                where s."LoanID" = l."LoanID" and s."UserID" = l."UserID"), 0)
    ),
    "MonthlyAmount" = coalesce(
        l."MonthlyAmount",
        (select s."AmountDue"
         from public."LoanPaymentSchedules" s
         where s."LoanID" = l."LoanID" and s."UserID" = l."UserID"
         order by s."DueDate", s."ScheduleID" limit 1)
    ),
    "MonthlyRequired" = coalesce(
        l."MonthlyRequired",
        exists (select 1 from public."LoanPaymentSchedules" s
                where s."LoanID" = l."LoanID" and s."UserID" = l."UserID")
    );

alter table public."Loans"
    alter column "MonthlyRequired" set default false,
    alter column "MonthlyRequired" set not null;

do $$
begin
    if not exists (select 1 from pg_constraint where conrelid = 'public."Loans"'::regclass and conname = 'loans_loan_user_unique') then
        alter table public."Loans" add constraint loans_loan_user_unique unique ("LoanID", "UserID");
    end if;
    if not exists (select 1 from pg_constraint where conrelid = 'public."Loans"'::regclass and conname = 'loans_due_day_check') then
        alter table public."Loans" add constraint loans_due_day_check check ("DueDay" between 1 and 31);
    end if;
    if not exists (select 1 from pg_constraint where conrelid = 'public."Loans"'::regclass and conname = 'loans_duration_months_check') then
        alter table public."Loans" add constraint loans_duration_months_check check ("DurationMonths" > 0);
    end if;
    if not exists (select 1 from pg_constraint where conrelid = 'public."Loans"'::regclass and conname = 'loans_monthly_amount_check') then
        alter table public."Loans" add constraint loans_monthly_amount_check
            check (not "MonthlyRequired" or ("MonthlyAmount" is not null and "MonthlyAmount" > 0));
    end if;
end;
$$;

alter table public."LoanPaymentSchedules"
    add column if not exists "PeriodNumber" integer;

with numbered_schedules as (
    select "ScheduleID",
           row_number() over (partition by "LoanID" order by "DueDate", "ScheduleID")::integer as period_number
    from public."LoanPaymentSchedules"
)
update public."LoanPaymentSchedules" s
set "PeriodNumber" = n.period_number
from numbered_schedules n
where s."ScheduleID" = n."ScheduleID" and s."PeriodNumber" is null;

alter table public."LoanPaymentSchedules"
    alter column "PeriodNumber" set not null;

create unique index if not exists loan_schedule_period_unique_idx
    on public."LoanPaymentSchedules" ("LoanID", "PeriodNumber");

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public."LoanPaymentSchedules"'::regclass
          and conname = 'loan_schedules_loan_user_fkey'
    ) then
        alter table public."LoanPaymentSchedules"
            add constraint loan_schedules_loan_user_fkey
            foreign key ("LoanID", "UserID")
            references public."Loans" ("LoanID", "UserID")
            on delete cascade not valid;
    end if;
end;
$$;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public."BankAccounts"'::regclass
          and conname = 'bank_accounts_id_user_unique'
    ) then
        alter table public."BankAccounts"
            add constraint bank_accounts_id_user_unique unique ("BankAccountID", "UserID");
    end if;
end;
$$;

alter table public."Transactions"
    add column if not exists "TransactionID" uuid default gen_random_uuid();

alter table public."Transactions"
    alter column "TransactionID" set not null;

create unique index if not exists transactions_transaction_id_unique_idx
    on public."Transactions" ("TransactionID");

alter table public."LoanPayments"
    alter column "ScheduleID" drop not null,
    add column if not exists "MonthOfPayment" date,
    add column if not exists "Adjustment" numeric(14,2) not null default 0,
    add column if not exists "TransactionID" uuid;

create unique index if not exists loan_payments_transaction_unique_idx
    on public."LoanPayments" ("TransactionID")
    where "TransactionID" is not null;

update public."LoanPayments" p
set "MonthOfPayment" = date_trunc('month', s."DueDate")::date
from public."LoanPaymentSchedules" s
where p."ScheduleID" = s."ScheduleID"
  and p."LoanID" = s."LoanID"
  and p."UserID" = s."UserID"
  and p."MonthOfPayment" is null;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public."LoanPayments"'::regclass
          and conname = 'loan_payments_adjustment_zero_check'
    ) then
        alter table public."LoanPayments"
            add constraint loan_payments_adjustment_zero_check check ("Adjustment" = 0);
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public."LoanPayments"'::regclass
          and conname = 'loan_payments_month_matches_schedule_check'
    ) then
        alter table public."LoanPayments"
            add constraint loan_payments_month_matches_schedule_check
            check (("ScheduleID" is null and "MonthOfPayment" is null)
                or ("ScheduleID" is not null and "MonthOfPayment" is not null));
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public."LoanPayments"'::regclass
          and conname = 'loan_payments_loan_user_fkey'
    ) then
        alter table public."LoanPayments"
            add constraint loan_payments_loan_user_fkey
            foreign key ("LoanID", "UserID")
            references public."Loans" ("LoanID", "UserID")
            not valid;
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public."LoanPayments"'::regclass
          and conname = 'loan_payments_account_user_fkey'
    ) then
        alter table public."LoanPayments"
            add constraint loan_payments_account_user_fkey
            foreign key ("BankAccountID", "UserID")
            references public."BankAccounts" ("BankAccountID", "UserID")
            not valid;
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public."LoanPayments"'::regclass
          and conname = 'loan_payments_transaction_fkey'
    ) then
        alter table public."LoanPayments"
            add constraint loan_payments_transaction_fkey
            foreign key ("TransactionID")
            references public."Transactions" ("TransactionID")
            on delete set null not valid;
    end if;
end;
$$;

revoke insert, update, delete on public."Loans", public."LoanPaymentSchedules" from authenticated;
grant select on public."Loans", public."LoanPaymentSchedules" to authenticated;

-- Loan creation and payment writes are only available through these
-- authenticated, ownership-checking, atomic database functions.

create or replace function public.create_loan_with_schedule(
    p_name text,
    p_original_amount numeric,
    p_monthly_amount numeric,
    p_vendor text,
    p_date_of_loan date,
    p_duration_months integer,
    p_monthly_required boolean
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_loan_id uuid;
    v_period integer;
    v_month date;
    v_due_date date;
    v_due_day integer;
begin
    if v_user_id is null then raise exception 'Authentication required'; end if;
    if p_name is null or length(trim(p_name)) not between 1 and 100 then raise exception 'Enter a loan name (up to 100 characters)'; end if;
    if p_vendor is null or length(trim(p_vendor)) not between 1 and 100 then raise exception 'Enter a vendor (up to 100 characters)'; end if;
    if p_original_amount is null or p_original_amount <= 0 or p_original_amount <> round(p_original_amount, 2) then
        raise exception 'Loan amount must be positive and use no more than two decimal places';
    end if;
    if p_date_of_loan is null or p_date_of_loan > current_date then raise exception 'Loan date must be today or earlier'; end if;
    if p_duration_months is null or p_duration_months <= 0 then raise exception 'Loan duration must be a positive number of months'; end if;
    if p_monthly_required is null then raise exception 'Choose whether monthly payments are required'; end if;
    if p_monthly_required and (p_monthly_amount is null or p_monthly_amount <= 0
        or p_monthly_amount <> round(p_monthly_amount, 2)) then
        raise exception 'Monthly amount must be positive and use no more than two decimal places';
    end if;
    if not p_monthly_required and p_monthly_amount is not null
        and (p_monthly_amount <= 0 or p_monthly_amount <> round(p_monthly_amount, 2)) then
        raise exception 'Optional monthly amount must be positive and use no more than two decimal places';
    end if;

    v_due_day := extract(day from p_date_of_loan)::integer;
    insert into public."Loans" (
        "UserID", "Name", "Type", "Vendor", "OriginalAmount", "Status",
        "DateOfLoan", "DueDay", "DurationMonths", "MonthlyAmount", "MonthlyRequired"
    ) values (
        v_user_id, trim(p_name), case when p_monthly_required then 'Installment' else 'Flexible' end,
        trim(p_vendor), p_original_amount, 'active', p_date_of_loan, v_due_day,
        p_duration_months, p_monthly_amount, p_monthly_required
    ) returning "LoanID" into v_loan_id;

    if p_monthly_required then
        for v_period in 1..p_duration_months loop
            v_month := (date_trunc('month', p_date_of_loan) + make_interval(months => v_period))::date;
            v_due_date := v_month + (
                least(
                    v_due_day,
                    extract(day from ((v_month + interval '1 month') - interval '1 day'))::integer
                ) - 1
            );
            insert into public."LoanPaymentSchedules" (
                "UserID", "LoanID", "PeriodNumber", "DueDate", "AmountDue"
            ) values (
                v_user_id, v_loan_id, v_period, v_due_date, p_monthly_amount
            );
        end loop;
    end if;

    return v_loan_id;
end;
$$;

create or replace function public.record_loan_payment(
    p_loan_id uuid,
    p_schedule_id uuid,
    p_bank_account_id uuid,
    p_amount numeric,
    p_payment_date date
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
    v_user_id uuid := auth.uid();
    v_loan public."Loans"%rowtype;
    v_schedule public."LoanPaymentSchedules"%rowtype;
    v_account public."BankAccounts"%rowtype;
    v_installment_paid numeric(14,2);
    v_loan_paid numeric(14,2);
    v_payment_id uuid;
    v_transaction_id uuid;
    v_month_of_payment date;
begin
    if v_user_id is null then raise exception 'Authentication required'; end if;
    if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
        raise exception 'Payment amount must be positive and use no more than two decimal places';
    end if;
    if p_payment_date is null or p_payment_date > current_date then raise exception 'Payment date must be today or earlier'; end if;

    select * into v_loan
    from public."Loans"
    where "LoanID" = p_loan_id and "UserID" = v_user_id
    for update;
    if not found or v_loan."Status" <> 'active' then raise exception 'Active loan not found'; end if;

    if v_loan."MonthlyRequired" then
        if p_schedule_id is null then raise exception 'Select an installment month for this loan'; end if;
        select * into v_schedule
        from public."LoanPaymentSchedules"
        where "ScheduleID" = p_schedule_id and "LoanID" = p_loan_id and "UserID" = v_user_id
        for update;
        if not found then raise exception 'Payment schedule not found for this loan'; end if;
        v_month_of_payment := date_trunc('month', v_schedule."DueDate")::date;
        select coalesce(sum("Amount"), 0) into v_installment_paid
        from public."LoanPayments"
        where "ScheduleID" = p_schedule_id and "LoanID" = p_loan_id and "UserID" = v_user_id;
        if p_amount > v_schedule."AmountDue" - v_installment_paid then
            raise exception 'Payment exceeds the remaining installment amount';
        end if;
    else
        if p_schedule_id is not null then raise exception 'This loan does not have monthly installments'; end if;
        v_month_of_payment := null;
    end if;

    select coalesce(sum("Amount"), 0) into v_loan_paid
    from public."LoanPayments"
    where "LoanID" = p_loan_id and "UserID" = v_user_id;
    if p_amount > v_loan."OriginalAmount" - v_loan_paid then raise exception 'Payment exceeds the remaining loan balance'; end if;

    select * into v_account
    from public."BankAccounts"
    where "BankAccountID" = p_bank_account_id and "UserID" = v_user_id
    for update;
    if not found then raise exception 'Payment account not found'; end if;
    if p_amount > v_account."Balance" then raise exception 'Insufficient account balance'; end if;

    insert into public."LoanPayments" (
        "UserID", "LoanID", "ScheduleID", "BankAccountID", "Amount",
        "PaymentDate", "MonthOfPayment", "Adjustment"
    ) values (
        v_user_id, p_loan_id, p_schedule_id, p_bank_account_id, p_amount,
        p_payment_date, v_month_of_payment, 0
    ) returning "PaymentID" into v_payment_id;

    update public."BankAccounts"
    set "Balance" = "Balance" - p_amount
    where "BankAccountID" = p_bank_account_id and "UserID" = v_user_id;

    insert into public."Transactions" (
        "UserID", "Date", "Payroll", "Sender", "Amount", "Reciever", "Purpose",
        "Transaction", "BankAccountID", "LoanID", "ScheduleID"
    ) values (
        v_user_id, p_payment_date, null, v_account."Name", p_amount, v_loan."Vendor",
        'Loan payment: ' || v_loan."Name", 'Loan', p_bank_account_id, p_loan_id, p_schedule_id
    ) returning "TransactionID" into v_transaction_id;

    update public."LoanPayments"
    set "TransactionID" = v_transaction_id
    where "PaymentID" = v_payment_id and "UserID" = v_user_id;

    if v_loan."OriginalAmount" - v_loan_paid - p_amount <= 0 then
        update public."Loans" set "Status" = 'closed'
        where "LoanID" = p_loan_id and "UserID" = v_user_id;
    end if;

    return v_payment_id;
end;
$$;

revoke all on function public.create_loan_with_schedule(text, numeric, numeric, text, date, integer, boolean) from public;
grant execute on function public.create_loan_with_schedule(text, numeric, numeric, text, date, integer, boolean) to authenticated;
revoke all on function public.record_loan_payment(uuid, uuid, uuid, numeric, date) from public;
grant execute on function public.record_loan_payment(uuid, uuid, uuid, numeric, date) to authenticated;

commit;

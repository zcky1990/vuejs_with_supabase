-- Staff-confirmed payment method for pay_now pre-orders (before kitchen processing)

alter table public.pre_orders
  add column if not exists confirmed_payment_method text
    check (
      confirmed_payment_method is null
      or confirmed_payment_method in ('cash', 'qris', 'transfer')
    );

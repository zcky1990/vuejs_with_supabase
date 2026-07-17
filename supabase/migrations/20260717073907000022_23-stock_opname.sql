-- Stock opname: physical count reconciliation with audit trail

alter table public.stock_movements
  drop constraint if exists stock_movements_movement_type_check;

alter table public.stock_movements
  add constraint stock_movements_movement_type_check
  check (movement_type in ('restock', 'sale', 'adjustment', 'opname'));

alter table public.stock_movements
  add column if not exists performed_by uuid references public.profiles(id);

create index if not exists stock_movements_opname_created_idx
  on public.stock_movements (movement_type, created_at desc)
  where movement_type = 'opname';

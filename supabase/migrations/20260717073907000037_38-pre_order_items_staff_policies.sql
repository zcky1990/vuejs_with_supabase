-- Staff can replace pre-order line items when adjusting orders in /orders/inbox

create policy "Allow authenticated delete on pre_order_items"
  on public.pre_order_items for delete
  to authenticated
  using (true);

create policy "Allow authenticated insert on pre_order_items"
  on public.pre_order_items for insert
  to authenticated
  with check (true);

create policy "Allow authenticated delete on pre_order_item_addons"
  on public.pre_order_item_addons for delete
  to authenticated
  using (true);

create policy "Allow authenticated insert on pre_order_item_addons"
  on public.pre_order_item_addons for insert
  to authenticated
  with check (true);

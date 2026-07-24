-- ============================================================
-- ORDENAMIENTO INTEGRAL DE PRODUCTOS
-- Visibilidad, lanzamientos, destacados y ofertas
-- Compatible con ejecuciones repetidas en Supabase/PostgreSQL.
-- ============================================================

begin;

-- 1) Columnas de control independientes.
alter table public.products
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_new_release boolean not null default true,
  add column if not exists new_release_until timestamptz;

-- 2) Normalizar estados históricos antes de crear la restricción.
-- inactive pasa a draft (oculto temporalmente).
-- discontinued pasa a archived (descontinuado/conservado).
update public.products
set status = case
  when status = 'inactive' then 'draft'
  when status = 'discontinued' then 'archived'
  when status is null or btrim(status) = '' then 'draft'
  else status
end
where status is null
   or btrim(status) = ''
   or status in ('inactive', 'discontinued');

-- Cualquier estado desconocido se conserva de forma segura como borrador.
update public.products
set status = 'draft'
where status not in ('active', 'draft', 'archived');

alter table public.products
  alter column status set default 'draft',
  alter column status set not null;

-- Quitar restricciones CHECK anteriores que controlen status.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.products drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end $$;

alter table public.products
  add constraint products_status_check
  check (status in ('active', 'draft', 'archived'));

-- 3) Migrar productos existentes a la regla histórica de 30 días.
update public.products
set
  is_new_release = coalesce(created_at, now()) >= now() - interval '30 days',
  new_release_until = coalesce(created_at, now()) + interval '30 days'
where new_release_until is null;

-- 4) Validación de oferta.
-- En este proyecto base_price es el precio de venta y compare_at_price
-- es el precio anterior tachado. Solo existe oferta cuando el anterior
-- es mayor que el precio de venta.
update public.products
set compare_at_price = null
where compare_at_price is not null
  and compare_at_price <= base_price;

alter table public.products
  drop constraint if exists products_compare_at_price_check;

alter table public.products
  add constraint products_compare_at_price_check
  check (
    compare_at_price is null
    or compare_at_price > base_price
  );

-- 5) Asignar automáticamente 30 días al activar "Nuevo lanzamiento"
-- sin proporcionar una fecha.
create or replace function public.set_product_new_release_until()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_new_release = true and new.new_release_until is null then
    new.new_release_until := coalesce(new.created_at, now()) + interval '30 days';
  end if;

  if new.is_new_release = false then
    new.new_release_until := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_product_new_release_until on public.products;
create trigger trg_set_product_new_release_until
before insert or update of is_new_release, new_release_until
on public.products
for each row
execute function public.set_product_new_release_until();

-- 6) Al ocultar/archivar un producto, quitarlo de carruseles históricos.
-- La marca is_featured se conserva para que vuelva a mostrarse al reactivar.
create or replace function public.hide_non_active_product_from_featured_carousel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'active' then
    update public.featured_products
    set is_active = false
    where product_id = new.id
      and is_active = true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hide_non_active_product_from_featured_carousel on public.products;
create trigger trg_hide_non_active_product_from_featured_carousel
after insert or update of status
on public.products
for each row
execute function public.hide_non_active_product_from_featured_carousel();

-- 7) Índices para las consultas públicas.
create index if not exists idx_products_public_catalog
  on public.products (status, created_at desc);

create index if not exists idx_products_new_releases
  on public.products (new_release_until desc, created_at desc)
  where status = 'active' and is_new_release = true;

create index if not exists idx_products_featured
  on public.products (created_at desc)
  where status = 'active' and is_featured = true;

create index if not exists idx_products_offers
  on public.products (created_at desc)
  where status = 'active' and compare_at_price is not null;

-- 8) Documentación en la base de datos.
comment on column public.products.status is
  'Visibilidad general: active=publicado, draft=oculto temporalmente, archived=descontinuado sin borrar.';
comment on column public.products.is_featured is
  'Muestra el producto en la sección de productos destacados del Home cuando status=active.';
comment on column public.products.is_new_release is
  'Control manual para incluir el producto en Nuevos lanzamientos.';
comment on column public.products.new_release_until is
  'Fecha límite de Nuevo lanzamiento; al activar sin fecha se asignan 30 días.';
comment on column public.products.compare_at_price is
  'Precio anterior tachado. Debe ser mayor que base_price para representar una oferta.';

commit;

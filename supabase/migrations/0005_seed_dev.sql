-- Dev seed helpers for goals and optional measurements
-- Safe to run multiple times; uses NOT EXISTS guards.
-- Note: Adjust the selected user for your environment.

-- Choose a dev user (first auth user). Modify as needed.
with dev_user as (
  select id as user_id from auth.users order by created_at asc limit 1
)
-- Seed example goals for the dev user
insert into public.goals (user_id, type, params, start_date, end_date, active, status)
select u.user_id,
       g.type,
       g.params::jsonb,
       (current_date - interval '7 days')::date as start_date,
       (current_date + interval '21 days')::date as end_date,
       true as active,
       'active' as status
from dev_user u
cross join (
  values
    ('body_fat', '{"targetPct": 15.0}'),
    ('weight', '{"targetWeightKg": 77.0, "direction": "down"}'),
    ('lean_mass_gain', '{"targetKg": 3.0}'),
    ('calorie_streak', '{"targetDays": 14, "basis": "recommended"}'),
    ('protein_streak', '{"gramsPerDay": 150, "targetDays": 14}')
) as g(type, params)
where not exists (
  select 1 from public.goals pg
  where pg.user_id = (select user_id from dev_user)
    and pg.type = g.type
);

-- Optional: seed a few goal_measurements rows for numeric goals (weekly points)
-- These are illustrative; remove if you prefer manual entry only.
with dev_user as (
  select id as user_id from auth.users order by created_at asc limit 1
),
base_goals as (
  select id, type from public.goals where user_id = (select user_id from dev_user)
)
insert into public.goal_measurements (goal_id, date, value, source)
select bg.id,
       d::date,
       case
         when bg.type = 'body_fat' then jsonb_build_object('bodyFatPct', 17.5)
         when bg.type = 'weight' then jsonb_build_object('weightKg', 80.5)
         when bg.type = 'lean_mass_gain' then jsonb_build_object('leanMassKg', 62.0)
         else jsonb_build_object('note', 'n/a')
       end,
       'manual'
from base_goals bg
join generate_series(current_date - interval '14 days', current_date, interval '7 days') as d on true
where bg.type in ('body_fat','weight','lean_mass_gain')
and not exists (
  select 1 from public.goal_measurements gm
  where gm.goal_id = bg.id and gm.date = d::date
);

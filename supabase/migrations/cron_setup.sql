To schedule the edge function, run this SQL query in the Supabase Dashboard SQL Editor.

```sql
-- Enable the necessary extensions if they aren't already
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Schedule the job to run every 30 minutes
select cron.schedule(
  'close-stale-sessions', 
  '*/30 * * * *', 
  $$
    select
      net.http_post(
          url:='https://cegmltnqimbxxxvsflwz.supabase.co/functions/v1/close-stale-sessions',
          headers:=jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', current_setting('request.jwt.claim.role', true) -- Or use anon key
          )
      ) as request_id;
  $$
);
```

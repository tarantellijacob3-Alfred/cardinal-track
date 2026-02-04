-- Approve Gregory Bing for coach access
update profiles
set role = 'coach', approved = true
where email = 'gregory1.bing@gmail.com';

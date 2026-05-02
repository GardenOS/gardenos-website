-- Exported from Airtable base appVcxgsLlVnnY3RD table Customers
-- Export time (UTC): 2026-05-01T10:36:17.610Z
-- Record count: 17

BEGIN;

CREATE TABLE IF NOT EXISTS public.airtable_customers (
  id bigserial PRIMARY KEY,
  airtable_record_id text UNIQUE,
  airtable_created_time timestamptz,
  full_name text,
  email text,
  lead_source text,
  notes text,
  scenario_needs text,
  language text,
  clerk_user_id text,
  phone text,
  wechat_id text,
  raw_fields jsonb
);

TRUNCATE TABLE public.airtable_customers;

INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('rec1r8qTEZVjnR8fs', '2026-04-17T01:08:51.000Z', 'Modi Yang', 'mofanyang424@gmail.com', NULL, NULL, NULL, 'English', NULL, NULL, NULL, '{"Email":"mofanyang424@gmail.com","Full Name":"Modi Yang","Language":"English"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('rec32aIibqtuEFoOK', '2026-04-13T23:21:44.000Z', 'modiyang&kaiyuyang', 'modiyang@sohu.com', 'WeChat Group', '我粗扼要啊的师傅家第四额外金发阿斯顿发送地方', NULL, NULL, NULL, NULL, NULL, '{"Notes":"我粗扼要啊的师傅家第四额外金发阿斯顿发送地方","Email":"modiyang@sohu.com","Full Name":"modiyang&kaiyuyang","Lead Source":"WeChat Group"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('rec4FnzYZxglpyDbT', '2026-04-13T09:30:06.000Z', '测试用户', 'test@mygardenos.com', 'WeChat Group', '这是一条测试记录，可以删除', NULL, NULL, NULL, NULL, NULL, '{"Notes":"这是一条测试记录，可以删除","Email":"test@mygardenos.com","Full Name":"测试用户","Lead Source":"WeChat Group"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('rec5CnQA7n3p4CSK7', '2026-04-08T01:10:48.000Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('rec6r9en0yY3WUgXR', '2026-04-13T10:09:56.000Z', 'yang kaiyu', 'yky123@sohu.com', 'Other', '400平米的花园分了三个区域。想申请测试样机', NULL, NULL, NULL, NULL, NULL, '{"Notes":"400平米的花园分了三个区域。想申请测试样机","Email":"yky123@sohu.com","Full Name":"yang kaiyu","Lead Source":"Other"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recAR6LBmicTP3XcM', '2026-04-08T01:10:48.000Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recLf7JnwEZW4Pw2x', '2026-04-14T05:36:24.000Z', 'Modi Yang', 'modiyang123@gmail.com', 'Other', NULL, NULL, NULL, NULL, NULL, NULL, '{"Email":"modiyang123@gmail.com","Full Name":"Modi Yang","Lead Source":"Other"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recMXMpWN9YMaQYLH', '2026-04-26T07:59:29.000Z', 'hao han', 'haohan6037@gmail.com', NULL, NULL, NULL, NULL, 'user_3Ct25vIEQAcq231012H9tIOMLzK', NULL, NULL, '{"Clerk User ID":"user_3Ct25vIEQAcq231012H9tIOMLzK","Email":"haohan6037@gmail.com","Full Name":"hao han"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recNMeeAAuFgPmEjT', '2026-04-24T00:01:07.000Z', 'ales tome', 'tomew@sslie.co.zn', NULL, NULL, 'asdfasfasdfasdfasdfasdsdaf', NULL, NULL, '024788766344', NULL, '{"Email":"tomew@sslie.co.zn","Full Name":"ales tome","Phone":"024788766344","Scenario & Needs":"asdfasfasdfasdfasdfasdsdaf"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recbWQOuqhE8lCJ5y', '2026-04-23T23:27:40.000Z', 'Victor', 'bjyky123@icloud.com', NULL, NULL, '我家花园非常大', NULL, NULL, NULL, NULL, '{"Email":"bjyky123@icloud.com","Full Name":"Victor","Scenario & Needs":"我家花园非常大"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recdMfThKnZBWMzri', '2026-04-13T10:43:15.000Z', 'Token测试', 'tokentest@mygardenos.com', 'Other', NULL, NULL, NULL, NULL, NULL, NULL, '{"Email":"tokentest@mygardenos.com","Full Name":"Token测试","Lead Source":"Other"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recdsWKa3GpsxsOEs', '2026-04-13T23:33:54.000Z', 'Leon', '13717998460@163.com', 'Other', NULL, NULL, NULL, NULL, NULL, NULL, '{"Email":"13717998460@163.com","Full Name":"Leon","Lead Source":"Other"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recgbLxQrAK92ZzTM', '2026-04-22T08:30:19.000Z', 'Min Hou', 'min.hou@youngproperty.co.nz', NULL, NULL, NULL, NULL, 'user_3ChnLAjKHc32adpxIlBYs1JWm0s', NULL, NULL, '{"Clerk User ID":"user_3ChnLAjKHc32adpxIlBYs1JWm0s","Email":"min.hou@youngproperty.co.nz","Full Name":"Min Hou"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('rechtbihbkE9kfkLB', '2026-04-08T01:10:48.000Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recloRgf4WJNeDvHk', '2026-04-24T00:00:12.000Z', 'Victor li', 'BJyky12#@sohu.com', NULL, NULL, 'woajsldfoaspdfjsdflksadjff', NULL, NULL, NULL, '0274299056', '{"Email":"BJyky12#@sohu.com","Full Name":"Victor li","Scenario & Needs":"woajsldfoaspdfjsdflksadjff","WeChat ID":"0274299056"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('recr41KPKP8PdVY5Z', '2026-04-23T05:04:23.000Z', 'Modi Yang', 'modiyang123@gmail.com', NULL, NULL, NULL, 'English', NULL, NULL, NULL, '{"Email":"modiyang123@gmail.com","Full Name":"Modi Yang","Language":"English"}'::jsonb);
INSERT INTO public.airtable_customers (airtable_record_id, airtable_created_time, full_name, email, lead_source, notes, scenario_needs, language, clerk_user_id, phone, wechat_id, raw_fields) VALUES ('reczuK6hNBraGerld', '2026-04-13T22:18:48.000Z', 'modi yang & mofan', 'modiyang@gmail.com', 'Other', '我的草地面非常大，要5台设备试用', NULL, NULL, NULL, NULL, NULL, '{"Notes":"我的草地面非常大，要5台设备试用","Email":"modiyang@gmail.com","Full Name":"modi yang & mofan","Lead Source":"Other"}'::jsonb);

COMMIT;

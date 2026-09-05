alter table public.documents
add column page_count integer,
add column upload_completed_at timestamptz;

alter table public.documents
add constraint documents_page_count_range
check (page_count is null or page_count between 1 and 2000);

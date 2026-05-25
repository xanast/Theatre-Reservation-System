ALTER TABLE seats
ADD COLUMN locked_by_user_id INT NULL,
ADD COLUMN locked_until DATETIME NULL;
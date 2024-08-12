-- PostgreSQL database schema creation script

-- Create the users table
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(45) UNIQUE,
    password VARCHAR(255) NOT NULL CHECK (length(password) >= 6),
    secrets TEXT
);

-- Create the sequence for id column
CREATE SEQUENCE public.users_id_seq
    AS INTEGER
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set default value for id column
ALTER TABLE ONLY public.users
    ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

-- Ensure the sequence is owned by the table's id column
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

-- Optional: Insert a sample user (remove or modify as needed)
INSERT INTO public.users (email, password, secrets) VALUES 
('ishay7@gmail.com', 'asdasd', NULL);

-- Complete

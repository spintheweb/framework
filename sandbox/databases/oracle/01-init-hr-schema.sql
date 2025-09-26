-- Oracle HR sample database initialization
-- Creates the classic HR schema with departments, employees, jobs, etc.

-- Create sequence for employee IDs
CREATE SEQUENCE employee_seq
START WITH 207
INCREMENT BY 1
NOCACHE;

-- Create sequence for department IDs
CREATE SEQUENCE dept_seq
START WITH 280
INCREMENT BY 10
NOCACHE;

-- Create REGIONS table
CREATE TABLE regions (
    region_id NUMBER(2) PRIMARY KEY,
    region_name VARCHAR2(25) NOT NULL
);

-- Create COUNTRIES table
CREATE TABLE countries (
    country_id CHAR(2) PRIMARY KEY,
    country_name VARCHAR2(40),
    region_id NUMBER(2),
    CONSTRAINT countries_reg_fk FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- Create LOCATIONS table
CREATE TABLE locations (
    location_id NUMBER(4) PRIMARY KEY,
    street_address VARCHAR2(40),
    postal_code VARCHAR2(12),
    city VARCHAR2(30) NOT NULL,
    state_province VARCHAR2(25),
    country_id CHAR(2),
    CONSTRAINT loc_c_id_fk FOREIGN KEY (country_id) REFERENCES countries(country_id)
);

-- Create DEPARTMENTS table
CREATE TABLE departments (
    department_id NUMBER(4) PRIMARY KEY,
    department_name VARCHAR2(30) NOT NULL,
    manager_id NUMBER(6),
    location_id NUMBER(4),
    CONSTRAINT dept_loc_fk FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- Create JOBS table
CREATE TABLE jobs (
    job_id VARCHAR2(10) PRIMARY KEY,
    job_title VARCHAR2(35) NOT NULL,
    min_salary NUMBER(6),
    max_salary NUMBER(6)
);

-- Create EMPLOYEES table
CREATE TABLE employees (
    employee_id NUMBER(6) PRIMARY KEY,
    first_name VARCHAR2(20),
    last_name VARCHAR2(25) NOT NULL,
    email VARCHAR2(25) NOT NULL UNIQUE,
    phone_number VARCHAR2(20),
    hire_date DATE NOT NULL,
    job_id VARCHAR2(10) NOT NULL,
    salary NUMBER(8,2),
    commission_pct NUMBER(2,2),
    manager_id NUMBER(6),
    department_id NUMBER(4),
    CONSTRAINT emp_job_fk FOREIGN KEY (job_id) REFERENCES jobs(job_id),
    CONSTRAINT emp_dept_fk FOREIGN KEY (department_id) REFERENCES departments(department_id),
    CONSTRAINT emp_manager_fk FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
);

-- Create JOB_HISTORY table
CREATE TABLE job_history (
    employee_id NUMBER(6),
    start_date DATE,
    end_date DATE NOT NULL,
    job_id VARCHAR2(10) NOT NULL,
    department_id NUMBER(4),
    PRIMARY KEY (employee_id, start_date),
    CONSTRAINT jhist_job_fk FOREIGN KEY (job_id) REFERENCES jobs(job_id),
    CONSTRAINT jhist_emp_fk FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    CONSTRAINT jhist_dept_fk FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

-- Insert sample data into REGIONS
INSERT INTO regions VALUES (1, 'Europe');
INSERT INTO regions VALUES (2, 'Americas');
INSERT INTO regions VALUES (3, 'Asia');
INSERT INTO regions VALUES (4, 'Middle East and Africa');

-- Insert sample data into COUNTRIES
INSERT INTO countries VALUES ('US', 'United States of America', 2);
INSERT INTO countries VALUES ('CA', 'Canada', 2);
INSERT INTO countries VALUES ('UK', 'United Kingdom', 1);
INSERT INTO countries VALUES ('DE', 'Germany', 1);
INSERT INTO countries VALUES ('JP', 'Japan', 3);

-- Insert sample data into LOCATIONS
INSERT INTO locations VALUES (1700, '2004 Charade Rd', '98199', 'Seattle', 'Washington', 'US');
INSERT INTO locations VALUES (1800, '147 Spadina Ave', 'M5V 2L7', 'Toronto', 'Ontario', 'CA');
INSERT INTO locations VALUES (2500, 'Magdalen Centre, The Oxford Science Park', 'OX9 9ZB', 'Oxford', 'Oxford', 'UK');
INSERT INTO locations VALUES (2700, 'Schwanthalerstr. 7031', '80925', 'Munich', 'Bavaria', 'DE');

-- Insert sample data into DEPARTMENTS
INSERT INTO departments VALUES (10, 'Administration', 200, 1700);
INSERT INTO departments VALUES (20, 'Marketing', 201, 1800);
INSERT INTO departments VALUES (50, 'Shipping', 121, 1500);
INSERT INTO departments VALUES (60, 'IT', 103, 1400);
INSERT INTO departments VALUES (80, 'Sales', 145, 2500);
INSERT INTO departments VALUES (90, 'Executive', 100, 1700);
INSERT INTO departments VALUES (110, 'Accounting', 205, 1700);

-- Insert sample data into JOBS
INSERT INTO jobs VALUES ('AD_PRES', 'President', 20000, 40000);
INSERT INTO jobs VALUES ('AD_VP', 'Administration Vice President', 15000, 30000);
INSERT INTO jobs VALUES ('AD_ASST', 'Administration Assistant', 3000, 6000);
INSERT INTO jobs VALUES ('AC_MGR', 'Accounting Manager', 8200, 16000);
INSERT INTO jobs VALUES ('AC_ACCOUNT', 'Public Accountant', 4200, 9000);
INSERT INTO jobs VALUES ('SA_MAN', 'Sales Manager', 10000, 20000);
INSERT INTO jobs VALUES ('SA_REP', 'Sales Representative', 6000, 12000);
INSERT INTO jobs VALUES ('IT_PROG', 'Programmer', 4000, 10000);
INSERT INTO jobs VALUES ('MK_MAN', 'Marketing Manager', 9000, 15000);
INSERT INTO jobs VALUES ('MK_REP', 'Marketing Representative', 4000, 9000);

-- Insert sample data into EMPLOYEES
INSERT INTO employees VALUES (100, 'Steven', 'King', 'SKING', '515.123.4567', DATE '1987-06-17', 'AD_PRES', 24000, NULL, NULL, 90);
INSERT INTO employees VALUES (101, 'Neena', 'Kochhar', 'NKOCHHAR', '515.123.4568', DATE '1989-09-21', 'AD_VP', 17000, NULL, 100, 90);
INSERT INTO employees VALUES (102, 'Lex', 'De Haan', 'LDEHAAN', '515.123.4569', DATE '1993-01-13', 'AD_VP', 17000, NULL, 100, 90);
INSERT INTO employees VALUES (103, 'Alexander', 'Hunold', 'AHUNOLD', '590.423.4567', DATE '1990-01-03', 'IT_PROG', 9000, NULL, 102, 60);
INSERT INTO employees VALUES (104, 'Bruce', 'Ernst', 'BERNST', '590.423.4568', DATE '1991-05-21', 'IT_PROG', 6000, NULL, 103, 60);
INSERT INTO employees VALUES (105, 'David', 'Austin', 'DAUSTIN', '590.423.4569', DATE '1997-06-25', 'IT_PROG', 4800, NULL, 103, 60);
INSERT INTO employees VALUES (200, 'Jennifer', 'Whalen', 'JWHALEN', '515.123.4444', DATE '1987-09-17', 'AD_ASST', 4400, NULL, 101, 10);
INSERT INTO employees VALUES (201, 'Michael', 'Hartstein', 'MHARTSTE', '515.123.5555', DATE '1996-02-17', 'MK_MAN', 13000, NULL, 100, 20);
INSERT INTO employees VALUES (202, 'Pat', 'Fay', 'PFAY', '603.123.6666', DATE '1997-08-17', 'MK_REP', 6000, NULL, 201, 20);

-- Add foreign key constraint for department manager
ALTER TABLE departments ADD CONSTRAINT dept_mgr_fk FOREIGN KEY (manager_id) REFERENCES employees(employee_id);

-- Update departments with manager IDs
UPDATE departments SET manager_id = 200 WHERE department_id = 10;
UPDATE departments SET manager_id = 201 WHERE department_id = 20;
UPDATE departments SET manager_id = 103 WHERE department_id = 60;
UPDATE departments SET manager_id = 100 WHERE department_id = 90;

-- Insert sample job history
INSERT INTO job_history VALUES (102, DATE '1993-01-13', DATE '1998-07-24', 'IT_PROG', 60);
INSERT INTO job_history VALUES (101, DATE '1989-09-21', DATE '1993-10-27', 'AC_ACCOUNT', 110);
INSERT INTO job_history VALUES (101, DATE '1993-10-28', DATE '1997-03-15', 'AC_MGR', 110);
INSERT INTO job_history VALUES (200, DATE '1987-09-17', DATE '1993-06-17', 'AD_ASST', 90);

-- Commit the transaction
COMMIT;
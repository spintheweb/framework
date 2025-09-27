-- SQL Server AdventureWorksLT sample database initialization
-- Creates a simplified version of the AdventureWorks database

-- Create the database
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AdventureWorksLT')
BEGIN
    CREATE DATABASE AdventureWorksLT;
END
GO

USE AdventureWorksLT;
GO

-- Create Product Category table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ProductCategory' AND xtype='U')
CREATE TABLE ProductCategory (
    ProductCategoryID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    ModifiedDate DATETIME DEFAULT GETDATE()
);

-- Create Product table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Product' AND xtype='U')
CREATE TABLE Product (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    ProductNumber NVARCHAR(25) NOT NULL UNIQUE,
    Color NVARCHAR(15),
    StandardCost MONEY,
    ListPrice MONEY NOT NULL,
    Size NVARCHAR(5),
    Weight DECIMAL(8,2),
    ProductCategoryID INT,
    ModifiedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductCategoryID) REFERENCES ProductCategory(ProductCategoryID)
);

-- Create Customer table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Customer' AND xtype='U')
CREATE TABLE Customer (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName NVARCHAR(128),
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    EmailAddress NVARCHAR(50),
    Phone NVARCHAR(25),
    ModifiedDate DATETIME DEFAULT GETDATE()
);

-- Create Sales Order Header table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SalesOrderHeader' AND xtype='U')
CREATE TABLE SalesOrderHeader (
    SalesOrderID INT IDENTITY(1,1) PRIMARY KEY,
    OrderDate DATETIME DEFAULT GETDATE(),
    CustomerID INT NOT NULL,
    SubTotal MONEY DEFAULT 0.00,
    TotalDue MONEY DEFAULT 0.00,
    ModifiedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);

-- Insert sample product categories
INSERT INTO ProductCategory (Name) VALUES 
('Bikes'), ('Components'), ('Clothing'), ('Accessories');

-- Insert sample products
INSERT INTO Product (Name, ProductNumber, Color, StandardCost, ListPrice, ProductCategoryID) VALUES 
('Mountain-100 Black, 38', 'BK-M68B-38', 'Black', 1898.09, 3374.99, 1),
('Mountain-100 Black, 42', 'BK-M68B-42', 'Black', 1898.09, 3374.99, 1),
('Mountain-100 Black, 44', 'BK-M68B-44', 'Black', 1898.09, 3374.99, 1),
('Road-150 Red, 62', 'BK-R93R-62', 'Red', 2171.29, 3578.27, 1),
('Road-150 Red, 44', 'BK-R93R-44', 'Red', 2171.29, 3578.27, 1),
('Touring-1000 Blue, 54', 'BK-T79U-54', 'Blue', 1481.35, 2384.07, 1),
('Chain', 'CH-0234', NULL, 8.99, 20.24, 2),
('Crown Race', 'CR-7833', NULL, 0.00, 0.00, 2),
('AWC Logo Cap', 'CA-1098', 'Multi', 6.92, 8.99, 4),
('Long-Sleeve Logo Jersey, S', 'LJ-0192-S', 'Multi', 38.49, 49.99, 3);

-- Insert sample customers
INSERT INTO Customer (CompanyName, FirstName, LastName, EmailAddress, Phone) VALUES 
('Bike World', 'Orlando', 'Gee', 'orlando0@adventure-works.com', '245-555-0173'),
('Progressive Sports', 'Keith', 'Harris', 'keith0@adventure-works.com', '170-555-0127'),
('Advanced Bike Components', 'Donna', 'Carreras', 'donna0@adventure-works.com', '279-555-0130'),
('Modular Cycle Systems', 'Janet', 'Gates', 'janet1@adventure-works.com', '710-555-0173'),
('Metropolitan Sports Supply', 'Lucy', 'Harrington', 'lucy0@adventure-works.com', '828-555-0186');

-- Insert sample sales orders
INSERT INTO SalesOrderHeader (CustomerID, SubTotal, TotalDue) VALUES 
(1, 3374.99, 3374.99),
(2, 3578.27, 3578.27),
(3, 2384.07, 2384.07),
(1, 20.24, 20.24),
(4, 49.99, 49.99);
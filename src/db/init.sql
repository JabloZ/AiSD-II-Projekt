--jak zmieniasz tu cos to walnij compose down i compose up, bo narazie nie obslugujemy migracji baz danych i to jest tylko do testowania
CREATE TABLE Houses(
    Id INT PRIMARY KEY,
    Path VARCHAR(255)
);
CREATE TABLE Minerals(
    Id INT PRIMARY KEY,
    Path VARCHAR(255)
);
CREATE TABLE Deposits(
    Id INT PRIMARY KEY,
    Path VARCHAR(255)
);
CREATE TABLE Dwarfs(
    Id INT PRIMARY KEY,
    Path VARCHAR(255)
);

CREATE TABLE Preferences(
    Id INT PRIMARY KEY,
    Path VARCHAR(255)
);

CREATE TABLE Map(
    Id INT PRIMARY KEY,
    Path VARCHAR(255)
);
--CREATE TABLE Distances(
--    FOREIGN KEY house_id REFERENCES House(id),
--    FOREIGN KEY deposit_id REFERENCES Deposit(id),
--    length INT
--)

INSERT INTO Houses VALUES (1,'test_data/houses.csv');
INSERT INTO Dwarfs VALUES (1,'test_data/dwarfs.csv');
INSERT INTO Deposits VALUES (1,'test_data/deposits.csv');
INSERT INTO Minerals VALUES (1,'test_data/minerals.csv');
INSERT INTO Preferences VALUES (1,'test_data/preferences.csv');
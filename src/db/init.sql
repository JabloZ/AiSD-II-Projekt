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

INSERT INTO Houses VALUES (1, 40, 50);
INSERT INTO Houses VALUES (2, 50, 50);

INSERT INTO Minerals VALUES (1,'Złoto');
INSERT INTO Minerals VALUES (2,'Srebro');

INSERT INTO Deposits VALUES (1,1,10,50,80);
INSERT INTO Deposits VALUES (2,2,12,100,20);

INSERT INTO Dwarfs VALUES (1,'Kamin',70,true,1,1);
INSERT INTO Dwarfs VALUES (2,'Zorak',30,true,2,2);
INSERT INTO Dwarfs VALUES (3,'Karoz',40,false,2,NULL);

INSERT INTO Preferences VALUES (1, 1, 0.3);
INSERT INTO Preferences VALUES (1, 2, 1);
INSERT INTO Preferences VALUES (2, 1, 1);
INSERT INTO Preferences VALUES (2, 2, 0.5);

--jak zmieniasz tu cos to walnij compose down -v i compose up, bo narazie nie obslugujemy migracji baz danych i to jest tylko do testowania

SET search_path TO zbior2;
CREATE TABLE Houses(
    Id INT PRIMARY KEY,
    X INT,
    Y INT
);
CREATE TABLE Minerals(
    id INT PRIMARY KEY,
    name VARCHAR(30)
);
CREATE TABLE Deposits(
    Id INT PRIMARY KEY,
    MineralId INT REFERENCES Minerals(id),
    Capacity INT,
    X INT,
    Y INT
);
CREATE TABLE Dwarfs(
    Id INT PRIMARY KEY,
    Name VARCHAR(50),
    Loudness INT,
    DepositAssigned BOOLEAN,
    HouseId INT REFERENCES Houses(id),
    DepositId INT NULL REFERENCES Deposits(id) 
);

CREATE TABLE Preferences(
    dwarf_id INT REFERENCES Dwarfs(id),
    mineral_id INT REFERENCES Minerals(id),
    multiplier FLOAT
);

CREATE TABLE Map(
    size_x INT,
    size_y INT
);
INSERT INTO Map VALUES (100,200);
INSERT INTO Minerals VALUES (1,'Diament');
INSERT INTO Minerals VALUES (2,'Srebro');
INSERT INTO Minerals VALUES (3,'Zelazo');
INSERT INTO Houses VALUES (1,35,98);
INSERT INTO Houses VALUES (2,82,173);
INSERT INTO Houses VALUES (3,51,112);
INSERT INTO Houses VALUES (4,46,187);
INSERT INTO Deposits VALUES (1,1,3,74,174);
INSERT INTO Deposits VALUES (2,2,20,22,32);
INSERT INTO Deposits VALUES (3,1,2,75,23);
INSERT INTO Dwarfs VALUES (1,'Kamin',58,true,3,2);
INSERT INTO Dwarfs VALUES (2,'Kamin',46,true,2,1);
INSERT INTO Dwarfs VALUES (3,'Bifur',3,false,1,NULL);
INSERT INTO Dwarfs VALUES (4,'Gilbert',86,true,4,1);
INSERT INTO Preferences VALUES (1, 2,0.4);
INSERT INTO Preferences VALUES (1, 1,0.55);
INSERT INTO Preferences VALUES (1, 3,0.54);
INSERT INTO Preferences VALUES (2, 2,0.43);
INSERT INTO Preferences VALUES (2, 3,0.75);
INSERT INTO Preferences VALUES (2, 1,0.75);
INSERT INTO Preferences VALUES (3, 3,1.11);
INSERT INTO Preferences VALUES (4, 1,1.84);
INSERT INTO Preferences VALUES (4, 2,0.9);
INSERT INTO Preferences VALUES (4, 3,1.82);

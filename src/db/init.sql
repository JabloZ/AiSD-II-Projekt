--jak zmieniasz tu cos to walnij compose down i compose up, bo narazie nie obslugujemy migracji baz danych i to jest tylko do testowania
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



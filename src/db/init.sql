--jak zmieniasz tu cos to walnij compose down i compose up, bo narazie nie obslugujemy migracji baz danych i to jest tylko do testowania

CREATE TABLE Dwarfs(
    id INT PRIMARY KEY,
    name VARCHAR(50),
    volume INT,
    depositAssigned BOOLEAN,
    FOREIGN KEY house_id REFERENCES House(id)
);
CREATE TABLE Minerals(
    id INT PRIMARY KEY,
    name VARCHAR(30)
)
CREATE TABLE Preferences(
    id INT PRIMARY KEY,
    FOREIGN KEY dwarf_id REFERENCES Dwarfs(id)
    FOREIGN KEY mineral_id REFERENCES Minerals(id)
    multiplier FLOAT
);
CREATE TABLE Deposit(
    id INT PRIMARY KEY,
    FOREIGN KEY mineral_id REFERENCES Minerals(id),
    capacity INT,
    x INT,
    y INT
)
CREATE TABLE DepositDwarfs(
    FOREIGN KEY dwarf_id REFERENCES Dwarfs(id),
    FOREIGN KEY deposit_id REFERENCES Deposit(id),
)
CREATE TABLE House(
    id INT PRIMARY KEY,
    x INT,
    y INT,
)
CREATE TABLE Map(
    size_x INT,
    size_y INT
)
CREATE TABLE Distances(
    FOREIGN KEY house_id REFERENCES House(id),
    FOREIGN KEY deposit_id REFERENCES Deposit(id),
)
INSERT INTO Dwarfs VALUES (1,'Kamin',70,false);
INSERT INTO Dwarfs VALUES (2,'Zorak',30,false);
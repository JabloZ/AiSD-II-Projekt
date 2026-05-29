-- jak zmieniasz tu cos to walnij: docker compose down -v && docker compose up --build -d

-- Rejestr zbiorów danych (w schemacie public)
CREATE TABLE public.datasets (
    name       VARCHAR(50) PRIMARY KEY,
    label      VARCHAR(100) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Funkcja tworząca nowy schemat ze wszystkimi tabelami
CREATE OR REPLACE FUNCTION public.create_dataset(schema_name TEXT, label TEXT DEFAULT '') RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

    EXECUTE format('
        CREATE TABLE %I.Minerals (
            Id   SERIAL PRIMARY KEY,
            Name VARCHAR(30) NOT NULL UNIQUE
        )', schema_name);

    EXECUTE format('
        CREATE TABLE %I.Houses (
            Id SERIAL PRIMARY KEY,
            X  INT NOT NULL,
            Y  INT NOT NULL
        )', schema_name);

    EXECUTE format('
        CREATE TABLE %I.Deposits (
            Id        SERIAL PRIMARY KEY,
            MineralId INT NOT NULL REFERENCES %I.Minerals(Id),
            Capacity  INT NOT NULL,
            X         INT NOT NULL,
            Y         INT NOT NULL
        )', schema_name, schema_name);

    EXECUTE format('
        CREATE TABLE %I.Dwarfs (
            Id              SERIAL PRIMARY KEY,
            Name            VARCHAR(50) NOT NULL,
            Loudness        INT NOT NULL DEFAULT 0,
            DepositAssigned BOOLEAN NOT NULL DEFAULT false,
            HouseId         INT NOT NULL REFERENCES %I.Houses(Id),
            DepositId       INT NULL REFERENCES %I.Deposits(Id)
        )', schema_name, schema_name, schema_name);

    EXECUTE format('
        CREATE TABLE %I.Preferences (
            dwarf_id   INT NOT NULL REFERENCES %I.Dwarfs(Id),
            mineral_id INT NOT NULL REFERENCES %I.Minerals(Id),
            multiplier FLOAT NOT NULL DEFAULT 1.0,
            PRIMARY KEY (dwarf_id, mineral_id)
        )', schema_name, schema_name, schema_name);

    EXECUTE format('
        CREATE TABLE %I.Config (
            Key   VARCHAR(50) PRIMARY KEY,
            Value JSONB NOT NULL DEFAULT ''null''
        )', schema_name);

    EXECUTE format('INSERT INTO %I.Config (Key, Value) VALUES (''border'', ''[]'')', schema_name);

    INSERT INTO public.datasets (name, label) VALUES (schema_name, label)
    ON CONFLICT (name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Domyślny zbiór z przykładowymi danymi
SELECT public.create_dataset('zbior1', 'Zbiór przykładowy');

INSERT INTO zbior1.Minerals (Name) VALUES ('Złoto'), ('Węgiel'), ('Miedź'), ('Srebro');
INSERT INTO zbior1.Houses (X, Y) VALUES (180, 200), (180, 310), (180, 420), (180, 530);
INSERT INTO zbior1.Deposits (MineralId, Capacity, X, Y) VALUES
    (1, 2, 700, 200),
    (2, 2, 700, 380),
    (3, 1, 700, 530);
INSERT INTO zbior1.Dwarfs (Name, HouseId) VALUES
    ('Karmina', 1), ('Bolek', 2), ('Tolek', 3), ('Zbyszek', 4);
INSERT INTO zbior1.Preferences (dwarf_id, mineral_id, multiplier) VALUES
    (1, 1, 1.0), (2, 2, 1.0), (3, 1, 0.8), (3, 3, 1.0), (4, 2, 1.0);

UPDATE zbior1.Config SET Value = '[{"x":80,"y":80},{"x":820,"y":80},{"x":820,"y":570},{"x":80,"y":570}]'::jsonb
WHERE Key = 'border';
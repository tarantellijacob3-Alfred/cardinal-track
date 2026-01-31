-- ==============================================
-- SEED DATA: Cardinal Track - Bishop Snyder T&F
-- ==============================================

-- Insert Events
INSERT INTO events (name, short_name, category, max_entries, is_relay) VALUES
  ('Pole Vault', 'PV', 'Field', 99, false),
  ('High Jump', 'HJ', 'Field', 99, false),
  ('Long Jump', 'LJ', 'Field', 99, false),
  ('Triple Jump', 'TJ', 'Field', 99, false),
  ('Shot Put', 'Shot', 'Field', 99, false),
  ('Javelin', 'Jav', 'Field', 99, false),
  ('Discus', 'Disc', 'Field', 99, false),
  ('100m', '100m', 'Sprint', 99, false),
  ('200m', '200m', 'Sprint', 99, false),
  ('400m', '400m', 'Sprint', 99, false),
  ('800m', '800m', 'Distance', 99, false),
  ('1600m', '1600m', 'Distance', 99, false),
  ('3200m', '3200m', 'Distance', 99, false),
  ('100m Hurdles', '100mH', 'Hurdles', 99, false),
  ('110m Hurdles', '110mH', 'Hurdles', 99, false),
  ('400m Hurdles', '400mH', 'Hurdles', 99, false),
  ('4x100 Relay A', '4x100A', 'Relay', 8, true),
  ('4x100 Relay Alt', '4x100Alt', 'Relay', 8, true),
  ('4x400 Relay A', '4x400A', 'Relay', 8, true),
  ('4x400 Relay Alt', '4x400Alt', 'Relay', 8, true),
  ('4x800 Relay A', '4x800A', 'Relay', 8, true),
  ('4x800 Relay Alt', '4x800Alt', 'Relay', 8, true),
  ('Miscellaneous', 'MISC', 'Other', 99, false);

-- Insert Athletes (Boys JV Roster)
INSERT INTO athletes (first_name, last_name, level, gender, active) VALUES
  ('Anthony', 'Akel', 'JV', 'Boys', true),
  ('Ethan', 'Ansley', 'JV', 'Boys', true),
  ('Tristan', 'Antonio', 'JV', 'Boys', true),
  ('Greyson', 'Aquino', 'JV', 'Boys', true),
  ('Trenton', 'Ash', 'JV', 'Boys', true),
  ('Gavin', 'Beck', 'JV', 'Boys', true),
  ('Michael', 'Biroschik', 'JV', 'Boys', true),
  ('Azeal', 'Brown', 'JV', 'Boys', true),
  ('Javaris', 'Davis', 'JV', 'Boys', true),
  ('Beniah', 'DiSandro', 'JV', 'Boys', true),
  ('Ben', 'Eller', 'JV', 'Boys', true),
  ('Chris', 'Elmer', 'JV', 'Boys', true),
  ('Emmanuel', 'Ewing', 'JV', 'Boys', true),
  ('Orlando', 'Feed', 'JV', 'Boys', true),
  ('Kevian', 'Feliciano', 'JV', 'Boys', true),
  ('Omar', 'Feliciano', 'JV', 'Boys', true),
  ('Andrew', 'Fredland', 'JV', 'Boys', true),
  ('Kenneth', 'Fredland', 'JV', 'Boys', true),
  ('Andres', 'Griffin', 'JV', 'Boys', true),
  ('Daniel', 'Hoff', 'JV', 'Boys', true),
  ('Jaden', 'Jones', 'JV', 'Boys', true),
  ('Uriel', 'Kuegah', 'JV', 'Boys', true),
  ('Adonis', 'Martin', 'JV', 'Boys', true),
  ('Taden', 'McGee', 'JV', 'Boys', true),
  ('Talen', 'McGee', 'JV', 'Boys', true),
  ('Reilly', 'McInnis', 'JV', 'Boys', true),
  ('Zane', 'Moya', 'JV', 'Boys', true),
  ('Matthew', 'Nettles', 'JV', 'Boys', true),
  ('Nathan', 'Page', 'JV', 'Boys', true),
  ('Jimmy', 'Pollard', 'JV', 'Boys', true),
  ('Ezra', 'Rosario-Hamblin', 'JV', 'Boys', true),
  ('Kyle', 'Sabartia', 'JV', 'Boys', true),
  ('Aidan', 'Serrano', 'JV', 'Boys', true),
  ('Michael', 'Teachout', 'JV', 'Boys', true),
  ('Landon', 'Thompson', 'JV', 'Boys', true),
  ('Nicholas', 'Tichy', 'JV', 'Boys', true),
  ('Vincenzo', 'Trinca', 'JV', 'Boys', true),
  ('Andrei', 'Valdres', 'JV', 'Boys', true),
  ('Andrei', 'Velez', 'JV', 'Boys', true),
  ('Micah', 'Wilder', 'JV', 'Boys', true),
  ('Alexander', 'Williams', 'JV', 'Boys', true),
  ('Mardy', 'Williams', 'JV', 'Boys', true),
  ('Breck', 'Winchester', 'JV', 'Boys', true),
  ('Brecken', 'Wright', 'JV', 'Boys', true),
  ('Cooper', 'Wright', 'JV', 'Boys', true),
  ('Robert', 'Wright', 'JV', 'Boys', true);

-- Additional athletes that appear in sample meet data but not in roster
INSERT INTO athletes (first_name, last_name, level, gender, active) VALUES
  ('Cameron', 'Balczon', 'JV', 'Boys', true),
  ('Jordan', 'Belt', 'JV', 'Boys', true),
  ('John', 'Bishop', 'JV', 'Boys', true),
  ('Michael', 'Bishop', 'JV', 'Boys', true),
  ('Emanuel', 'Bruny', 'JV', 'Boys', true),
  ('Nari', 'Carney', 'JV', 'Boys', true),
  ('Daniel', 'Carpenter', 'JV', 'Boys', true),
  ('Dylan', 'Carter', 'JV', 'Boys', true),
  ('Matthew', 'French', 'JV', 'Boys', true),
  ('Gabriel', 'Gonzalez', 'JV', 'Boys', true),
  ('Hassan', 'Greene', 'JV', 'Boys', true),
  ('Cody', 'Hoffer', 'JV', 'Boys', true),
  ('Quint', 'Jamieson', 'JV', 'Boys', true),
  ('Ben', 'Jokisch', 'JV', 'Boys', true),
  ('Trey', 'Jones', 'JV', 'Boys', true),
  ('Murphy', 'Lally', 'JV', 'Boys', true),
  ('Joel', 'Lowe', 'JV', 'Boys', true),
  ('Patrick', 'Lydon', 'JV', 'Boys', true),
  ('Ryan', 'Lydon', 'JV', 'Boys', true),
  ('Paul', 'McCranie', 'JV', 'Boys', true),
  ('Connor', 'McInnis', 'JV', 'Boys', true),
  ('Devin', 'McLeod', 'JV', 'Boys', true),
  ('Kayden', 'Mitchell', 'JV', 'Boys', true),
  ('Akhairi', 'Rhymer', 'JV', 'Boys', true),
  ('William', 'Richardson', 'JV', 'Boys', true),
  ('Lucas', 'Roberts', 'JV', 'Boys', true),
  ('Liam', 'Russell', 'JV', 'Boys', true),
  ('Joe', 'Scaldo', 'JV', 'Boys', true),
  ('Luke', 'Scaldo', 'JV', 'Boys', true),
  ('Matthew', 'Sparks', 'JV', 'Boys', true),
  ('Henry', 'Tate', 'JV', 'Boys', true),
  ('Owen', 'Thompson', 'JV', 'Boys', true),
  ('Leonardo', 'Torres', 'JV', 'Boys', true),
  ('Ryan', 'Turner', 'JV', 'Boys', true),
  ('Nick', 'Wilson', 'JV', 'Boys', true);

-- Insert Sample Meet
INSERT INTO meets (name, date, location, level, notes) VALUES
  ('BOYS JV Meet #1', '2025-02-11', 'Bishop Snyder HS', 'JV', 'First JV meet of the season');

-- Insert meet entries using subqueries
-- PV entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Cameron' AND last_name = 'Balczon' LIMIT 1), (SELECT id FROM events WHERE short_name = 'PV')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Jordan' AND last_name = 'Belt' LIMIT 1), (SELECT id FROM events WHERE short_name = 'PV')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'John' AND last_name = 'Bishop' LIMIT 1), (SELECT id FROM events WHERE short_name = 'PV')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Michael' AND last_name = 'Bishop' LIMIT 1), (SELECT id FROM events WHERE short_name = 'PV')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Emanuel' AND last_name = 'Bruny' LIMIT 1), (SELECT id FROM events WHERE short_name = 'PV'));

-- TJ entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Nari' AND last_name = 'Carney' LIMIT 1), (SELECT id FROM events WHERE short_name = 'TJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Daniel' AND last_name = 'Carpenter' LIMIT 1), (SELECT id FROM events WHERE short_name = 'TJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Dylan' AND last_name = 'Carter' LIMIT 1), (SELECT id FROM events WHERE short_name = 'TJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Kevian' AND last_name = 'Feliciano' LIMIT 1), (SELECT id FROM events WHERE short_name = 'TJ'));

-- HJ entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Matthew' AND last_name = 'French' LIMIT 1), (SELECT id FROM events WHERE short_name = 'HJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Gabriel' AND last_name = 'Gonzalez' LIMIT 1), (SELECT id FROM events WHERE short_name = 'HJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Hassan' AND last_name = 'Greene' LIMIT 1), (SELECT id FROM events WHERE short_name = 'HJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Cody' AND last_name = 'Hoffer' LIMIT 1), (SELECT id FROM events WHERE short_name = 'HJ'));

-- LJ entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Quint' AND last_name = 'Jamieson' LIMIT 1), (SELECT id FROM events WHERE short_name = 'LJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Ben' AND last_name = 'Jokisch' LIMIT 1), (SELECT id FROM events WHERE short_name = 'LJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Trey' AND last_name = 'Jones' LIMIT 1), (SELECT id FROM events WHERE short_name = 'LJ')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Murphy' AND last_name = 'Lally' LIMIT 1), (SELECT id FROM events WHERE short_name = 'LJ'));

-- Shot Put entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Joel' AND last_name = 'Lowe' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Shot')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Patrick' AND last_name = 'Lydon' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Shot')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Ryan' AND last_name = 'Lydon' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Shot')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Adonis' AND last_name = 'Martin' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Shot'));

-- Javelin entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Paul' AND last_name = 'McCranie' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Jav')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Connor' AND last_name = 'McInnis' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Jav')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Devin' AND last_name = 'McLeod' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Jav')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Kayden' AND last_name = 'Mitchell' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Jav'));

-- Discus entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Akhairi' AND last_name = 'Rhymer' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Disc')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'William' AND last_name = 'Richardson' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Disc')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Lucas' AND last_name = 'Roberts' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Disc')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Liam' AND last_name = 'Russell' LIMIT 1), (SELECT id FROM events WHERE short_name = 'Disc'));

-- 4x800 A entries (relay)
INSERT INTO meet_entries (meet_id, athlete_id, event_id, relay_leg, relay_team) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Joe' AND last_name = 'Scaldo' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800A'), 1, 'A'),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Luke' AND last_name = 'Scaldo' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800A'), 2, 'A'),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Matthew' AND last_name = 'Sparks' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800A'), 3, 'A'),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Henry' AND last_name = 'Tate' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800A'), 4, 'A');

-- 4x800 Alt entries (relay)
INSERT INTO meet_entries (meet_id, athlete_id, event_id, relay_leg, relay_team) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Landon' AND last_name = 'Thompson' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800Alt'), 1, 'Alt'),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Owen' AND last_name = 'Thompson' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800Alt'), 2, 'Alt'),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Leonardo' AND last_name = 'Torres' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800Alt'), 3, 'Alt'),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Vincenzo' AND last_name = 'Trinca' LIMIT 1), (SELECT id FROM events WHERE short_name = '4x800Alt'), 4, 'Alt');

-- 3200m entries
INSERT INTO meet_entries (meet_id, athlete_id, event_id) VALUES
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Ryan' AND last_name = 'Turner' LIMIT 1), (SELECT id FROM events WHERE short_name = '3200m')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Nick' AND last_name = 'Wilson' LIMIT 1), (SELECT id FROM events WHERE short_name = '3200m')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Cooper' AND last_name = 'Wright' LIMIT 1), (SELECT id FROM events WHERE short_name = '3200m')),
  ((SELECT id FROM meets WHERE name = 'BOYS JV Meet #1'), (SELECT id FROM athletes WHERE first_name = 'Brecken' AND last_name = 'Wright' LIMIT 1), (SELECT id FROM events WHERE short_name = '3200m'));

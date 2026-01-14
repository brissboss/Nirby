-- Trigger for Poi
CREATE OR REPLACE FUNCTION update_poi_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS poi_location_trigger ON "Poi";
CREATE TRIGGER poi_location_trigger
BEFORE INSERT OR UPDATE ON "Poi"
FOR EACH ROW EXECUTE FUNCTION update_poi_location();

-- Trigger for GooglePlaceCache
CREATE OR REPLACE FUNCTION update_google_place_cache_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_place_cache_location_trigger ON "GooglePlaceCache";
CREATE TRIGGER google_place_cache_location_trigger
BEFORE INSERT OR UPDATE ON "GooglePlaceCache"
FOR EACH ROW EXECUTE FUNCTION update_google_place_cache_location();

-- Update existing data
UPDATE "Poi" 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE location IS NULL;

UPDATE "GooglePlaceCache"
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE location IS NULL;
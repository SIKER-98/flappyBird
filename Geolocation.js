import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";

const findCoordinates = (callback) => {
  // pobranie informacji o lokalizacji
  Geolocation.getCurrentPosition(position => {
      const location = JSON.stringify(position);
      console.log("My location: ", location);

      // wyszczególnienie danych o położeniu
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;


      Geocoder.init("AIzaSyBB9ERk2ZjkaVqJkGG8TNmHYw97vJqkmOc"); // klucz API Google

      // wyslanie do googla swojego polozenia i otrzymanie adresu
      return Geocoder.from({ latitude, longitude }, { language: "pl" })
        .then(json => {
          let location = json.results[0].formatted_address;
          console.log(location);
          callback({ location });
        })
        .catch(error => {
          console.warn("GPS error", error);
          callback("GPS error");
        });

    }, error => {
      callback("GPS error");
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
  );
};


export default findCoordinates;

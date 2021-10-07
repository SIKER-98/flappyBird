import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import { Alert } from "react-native";

const findCoordinates = (callback) => {
  Geolocation.getCurrentPosition(position => {
      const location = JSON.stringify(position);
      console.log("My location: ", location);

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      Geocoder.init("AIzaSyBB9ERk2ZjkaVqJkGG8TNmHYw97vJqkmOc");
      return Geocoder.from({ latitude, longitude }, { language: "pl" })
        .then(json => {
          let location = json.results[0].formatted_address;
          console.log(location);
          callback({ location });
        })
        .catch(error => {
          console.warn("Geolocation 22", error);
          callback("GPS error");
        });

    }, error => {
      callback("GPS error");
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
  );
};


export default findCoordinates;

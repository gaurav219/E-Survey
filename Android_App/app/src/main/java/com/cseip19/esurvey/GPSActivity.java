/*
    This activity is used to check the status of GPS.
        If GPS is turned on then getLocation method is used which is called in OnStart
        If GPS is turned off then you have to turn on the GPS to proceed to next activity, in this case location callback is called

    In both the cases after getting the current location using GPS, the location constants are updated.
    The current location is sent to PendingSurveyActivity
        where the coordinates are used to calculate distance of colleges from current location.
 */
package com.cseip19.esurvey;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;

import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.util.Log;

import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.cseip19.esurvey.R;
import com.cseip19.esurvey.my_utils.AppConstants;
import com.cseip19.esurvey.my_utils.GPSUtils;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;

public class GPSActivity extends AppCompatActivity {

    private static final String TAG = "GPSActivity";

    private FusedLocationProviderClient fusedLocationProviderClient;
    private LocationRequest locationRequest;
    private LocationCallback locationCallback;
    private boolean isContinue = false;
    private boolean isGPS = false;

    private Button gpsButton;
    private TextView txtLocation;
    private ImageView imageView;
    private String status = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_gps);

        init();

        status = getIntent().getStringExtra("status");

        locationRequest = LocationRequest.create();
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setInterval(10000);
        locationRequest.setFastestInterval(5000);

        final GPSUtils gpsUtils = new GPSUtils(this);
        gpsUtils.turnGPSOn(new GPSUtils.onGpsListener() {
            @Override
            public void gpsStatus(boolean isGPSEnable) {
                // turn on GPS
                isGPS = isGPSEnable;
            }
        });

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    if (location != null) {
                        AppConstants.longitude = location.getLongitude();
                        AppConstants.latitude = location.getLatitude();
                        if (!isContinue) {
                            Log.d(TAG, "locationCallback: Coordinates" + AppConstants.latitude + "  " + AppConstants.longitude);
                            Intent intent = new Intent(GPSActivity.this, PendingSurveyActivity.class);
                            intent.putExtra("status", status);
                            startActivity(intent);
                            finish();
//                            txtLocation.setText(String.format(Locale.US, "%s - %s", wayLatitude, wayLongitude));
                        } else {
//                            for continuous location updates
                            Log.e(TAG, "onLocationResult: "+ location.getLatitude()+" "+location.getLongitude() );

                        }
                        if (!isContinue && fusedLocationProviderClient != null) {
                            fusedLocationProviderClient.removeLocationUpdates(locationCallback);
                        }
                    }
                }
            }
        };

        gpsButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                gpsUtils.turnGPSOn(new GPSUtils.onGpsListener() {
                    @Override
                    public void gpsStatus(boolean isGPSEnable) {
                        // turn on GPS
                        isGPS = isGPSEnable;
                    }
                });
                gpsCheck();
                getLocation();
            }
        });
    }

    private void init() {
        fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(this);
        gpsButton = findViewById(R.id.gpsButton);
        txtLocation = findViewById(R.id.txtLocation);
        imageView = findViewById(R.id.image);
    }

    @Override
    protected void onStart() {
        super.onStart();
        gpsCheck();
    }

    private void gpsCheck() {
        if (!isGPS) {
            imageView.setVisibility(View.VISIBLE);
            gpsButton.setVisibility(View.VISIBLE);
            return;
        } else {
            imageView.setVisibility(View.GONE);
            gpsButton.setVisibility(View.GONE);
        }
        isContinue = false;
        getLocation();
    }

    private void getLocation() {
        /*
        Use this code in case permission is requested in this activity...
        As of now permission is requested and handled in MainActivity
        So there is no need to again request or check the permission.
*/
        if (ActivityCompat.checkSelfPermission(GPSActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(GPSActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(GPSActivity.this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                    AppConstants.LOCATION_REQUEST);
        } else {
            if (isContinue) {
                // To get continuous location updates...this feature is not available to user but coded for future use
                fusedLocationProviderClient.requestLocationUpdates(locationRequest, locationCallback, null);

            } else {
                // To get last location coordinates
                fusedLocationProviderClient.getLastLocation().addOnSuccessListener(new OnSuccessListener<Location>() {
                    @Override
                    public void onSuccess(Location location) {
                        if (location != null) {
                            AppConstants.longitude = location.getLongitude();
                            AppConstants.latitude = location.getLatitude();
                            Log.d(TAG, "getLocation: onSuccess: Coordinates" + AppConstants.latitude + "  " + AppConstants.longitude);
                            Intent intent = new Intent(GPSActivity.this, PendingSurveyActivity.class);
                            intent.putExtra("status", status);
                            startActivity(intent);
                            finish();
                        } else {
                            fusedLocationProviderClient.requestLocationUpdates(locationRequest, locationCallback, null);
                        }
                    }
                });
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == Activity.RESULT_OK) {
            if (requestCode == AppConstants.GPS_REQUEST) {
                isGPS = true; // flag maintain before get location
            }
        }
    }


    //TODO: Function to check if the college is within 50 metres of current location
    /*
    private void proximityCheck() {
        fusedLocationProviderClient.getLastLocation().addOnCompleteListener(new OnCompleteListener<Location>() {
            @Override
            public void onComplete(@NonNull Task<Location> task) {
                // Got the location, can check for proximity
                Location location = task.getResult();
                if (location != null) {
                    Toast.makeText(GPSActivity.this, "Got current location", Toast.LENGTH_SHORT).show();
                    double currentLat = location.getLatitude();
                    double currentLong = location.getLongitude();
                    Geocoder geocoder = new Geocoder(GPSActivity.this);
                    try {
                        List<Address> addresses = geocoder.getFromLocation(currentLat, currentLong, 1);
                        Log.d(TAG, "Coordinates: Current " + addresses.get(0).getLocality());
                        Log.d(TAG, "Coordinates: Current " + currentLat + ", " + currentLong);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    if (MyUtils.distance(currentLat, collegeLatitude, currentLong, collegeLongitude) < 200) {

                    } else {
                        Toast.makeText(GPSActivity.this, "Not in the area of college to start surevey", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Log.d(TAG, "Coordinates: null");
                }
            }
        });
    }
    */

    /*
    Use this code in case permission is requested in this activity...
    As of now permission is handled in MainActivity
    So there is no need to again handle the permission result and get location.

    @SuppressLint("MissingPermission")
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case 1000: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    if (isContinue) {
                        fusedLocationProviderClient.requestLocationUpdates(locationRequest, locationCallback, null);
                    } else {
                        fusedLocationProviderClient.getLastLocation().addOnSuccessListener(new OnSuccessListener<Location>() {
                            @Override
                            public void onSuccess(Location location) {
                                if (location != null) {
                                    AppConstants.longitude = location.getLongitude();
                                    AppConstants.latitude = location.getLatitude();
                                    Log.d(TAG, "permission: onSuccess: Coordinates" + AppConstants.latitude + "  " + AppConstants.longitude);
                                    Intent intent = new Intent(GPSActivity.this, PendingSurveyActivity.class);
                                    intent.putExtra("status", "open");
                                    startActivity(intent);

                                    finish();
//                                    txtLocation.setText(String.format(Locale.US, "%s - %s", wayLatitude, wayLongitude));
                                } else {
                                    fusedLocationProviderClient.requestLocationUpdates(locationRequest, locationCallback, null);
                                }
                            }
                        });
                    }
                } else {
                    Toast.makeText(this, "Permission denied", Toast.LENGTH_SHORT).show();

                    //Display the image to tell the user that permission is necessary.

                }
                break;
            }
        }
    }
*/

}

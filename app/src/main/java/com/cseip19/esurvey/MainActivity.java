/*
  This activity loads after splash activity.
  Location permission is checked.
  Checks if the currently logged in user is verified.
  Details of currently logged in user are fetched and stored in CurrentUser class.
  Provide UI/link for new surveys and survey history
 */

package com.cseip19.esurvey;

import androidx.annotation.NonNull;
import androidx.appcompat.app.ActionBarDrawerToggle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.drawerlayout.widget.DrawerLayout;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Toast;

import com.cseip19.esurvey.my_utils.AppConstants;
import com.cseip19.esurvey.my_utils.AppUtils;
import com.cseip19.esurvey.my_utils.CurrentUser;
import com.cseip19.esurvey.my_utils.Survey;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.navigation.NavigationView;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.firestore.auth.User;

import java.util.Locale;
import java.util.Map;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";
    private FirebaseAuth mAuth;
    private FirebaseUser currentUser;
    private boolean allowed = false, dialogShown;

    private Button pending, history, allowButton;
    private RelativeLayout surveyLayout;
    private RelativeLayout permissionLayout;

    DrawerLayout drawerLayout;
    ActionBarDrawerToggle barDrawerToggle;
    NavigationView navigationView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        androidx.appcompat.widget.Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        drawerLayout = findViewById(R.id.drawerLayout);
        barDrawerToggle = new ActionBarDrawerToggle(this, drawerLayout, toolbar, R.string.openDrawer, R.string.closeDrawer);
        drawerLayout.addDrawerListener(barDrawerToggle);
        barDrawerToggle.setDrawerIndicatorEnabled(true);   //enable hamburger
        barDrawerToggle.getDrawerArrowDrawable().setColor(getResources().getColor(R.color.white));
        barDrawerToggle.syncState();
        navigationView = findViewById(R.id.nav_view);

        navigationView.setNavigationItemSelectedListener(new NavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                switch (item.getItemId()) {
                    case R.id.signout:
                        mAuth.signOut();
                        finish();
                        break;
                    case R.id.profile:
                        startActivity(new Intent(MainActivity.this, ProfileActivity.class));
                        break;
                    default:
                        return false;
                }
                return false;
            }
        });

        init();

        // Step 1: check for permissions (done using onstart)

        // Step 2: Check if user is verified
        if (currentUser != null && currentUser.isEmailVerified()) {
            //User is verified
            surveyLayout.setVisibility(View.VISIBLE);
            // Step 3: Save details of user for later use
            getUserDetails();
        } else {
            // disable access to apps
            // dialog.display();
            AlertDialog.Builder dialog = AppUtils.nonDismissableDialog(this.getString(R.string.verif_dialog), R.drawable.not_verified, this);
            dialog.setCancelable(true);
            dialog.show();
            dialogShown = true;
            pending.setEnabled(false);
            history.setEnabled(false);
        }

        pending.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
//                startActivity(new Intent(MainActivity.this, PendingSurveyActivity.class));
                Intent intent = new Intent(MainActivity.this, GPSActivity.class);
//                Intent intent = new Intent(MainActivity.this, ImageUploadActivity.class);
                intent.putExtra("status", "open");
                startActivity(intent);
            }
        });

        history.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(MainActivity.this, GPSActivity.class);
                intent.putExtra("status", "completed");
                startActivity(intent);
            }
        });

        allowButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                        AppConstants.LOCATION_REQUEST);
            }
        });
    }

    private void init() {
        pending = findViewById(R.id.button1);
        history = findViewById(R.id.button2);
        mAuth = FirebaseAuth.getInstance();
        currentUser = mAuth.getCurrentUser();
        surveyLayout = findViewById(R.id.surveyLayout);
        permissionLayout = findViewById(R.id.permissionLayout);
        allowButton = findViewById(R.id.allowButton);
    }

//    @Override
//    public boolean onCreateOptionsMenu(Menu menu) {
//        MenuInflater inflater = getMenuInflater();
//        inflater.inflate(R.menu.menu_main, menu);
//        return true;
//    }
//
//    @Override
//    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
//        if (item.getItemId() == R.id.logout) {
//            mAuth.signOut();
//            finish();
//            return true;
//        } else {
//            return super.onOptionsItemSelected(item);
//        }
//    }

    @Override
    protected void onStart() {
        super.onStart();
        checkPermissions();
        AppUtils.getRange();
    }

    private void checkPermissions() {
        if (ActivityCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionLayout.setVisibility(View.VISIBLE);
            surveyLayout.setVisibility(View.GONE);
        } else {
        /*
          Permissions are already granted, dont do anything
         */
            permissionLayout.setVisibility(View.GONE);
            surveyLayout.setVisibility(View.VISIBLE);
        }
    }

    @SuppressLint("MissingPermission")
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        switch (requestCode) {
            case 1000: {
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0
                        && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    permissionLayout.setVisibility(View.GONE);
                    surveyLayout.setVisibility(View.VISIBLE);
                } else {
                    //TODO: Display the image to tell the user that permission is necessary.
                    permissionLayout.setVisibility(View.VISIBLE);
                    surveyLayout.setVisibility(View.GONE);
                }
                break;
            }
        }
    }

    private void getUserDetails() {
        FirebaseFirestore db = FirebaseFirestore.getInstance();
        CollectionReference ref = db.collection(AppConstants.surveyorRef);
        ref.whereEqualTo("gmailID", currentUser.getEmail()).get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
            @Override
            public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
                if (queryDocumentSnapshots.isEmpty()) {
                    Toast.makeText(MainActivity.this, "No details exist for current user", Toast.LENGTH_SHORT).show();
                } else {
                    for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                        Map<String, Object> map = document.getData();
                        CurrentUser.setter((String) map.get("age"), (String) map.get("contactNumber"), (String) map.get("firstname"),
                                (String) map.get("middlename"), (String) map.get("lastname"), (String) map.get("gmailID"));
                        break;
                    }
                }
            }
        });
    }

    @Override
    public void onBackPressed() {
        if (dialogShown) {
            finish();
        } else {
            super.onBackPressed();
        }
    }
}

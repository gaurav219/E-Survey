package com.cseip19.esurvey;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.FileProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.Manifest;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.os.Environment;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.cseip19.esurvey.my_utils.AppConstants;
import com.cseip19.esurvey.my_utils.AppUtils;
import com.cseip19.esurvey.my_utils.QnA;
import com.cseip19.esurvey.my_utils.SurveyAdapter;
import com.google.android.gms.common.api.ResolvableApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.Continuation;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.OnPausedListener;
import com.google.firebase.storage.OnProgressListener;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;
import com.gun0912.tedpermission.PermissionListener;
import com.gun0912.tedpermission.TedPermission;

import java.io.File;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
    Activity is used to get ratings of various questions of survey
    Step1: Get the categories of the questions and store it in app constants class's ArrayList
    Step2: From the ArrayList, get category and load the questions with rating bar in recyclerview
            Used button onClickListener to load next category each time button is clicked.
            First click is performed automatically as soon as categories are retrieved and stored
    Step3: Keep getting current location of the user and check if user is in range (to be done continuously).
    TODO: As soon as next button is clicked, I want to get all the questions of the category along with their answer(functionality to be added later)
          & ratings and store it in database under "answers" collections.
 */

public class StartSurveyActivity extends AppCompatActivity implements SurveyAdapter.OnRecordEventListener {

    // Utils for implementing continuous location updates
    private double latitude, longitude;
    DecimalFormat df = new DecimalFormat("###.##");
    private LinearLayout errorLayout;
    private TextView timerView, descriptionView, titleView;
    public static final int LOCATION_REQUEST = 1000;
    private static final String TAG2 = "LocationTag";
    private FusedLocationProviderClient fusedLocationProviderClient;
    private LocationRequest locationRequest;
    private LocationCallback locationCallback = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult locationResult) {
            if (locationResult == null) {
                return;
            }
            for (Location location : locationResult.getLocations()) {
//                use location from here to perform your tasks
                double dist = AppUtils.distance(latitude, location.getLatitude(), longitude, location.getLongitude());
//                Toast.makeText(StartSurveyActivity.this, df.format(dist), Toast.LENGTH_SHORT).show();
                coordinateTextView.setText(df.format(dist));
                Log.d(TAG, "onLocationResult: " + location.getLatitude() + "-" + location.getLongitude());
                Log.d(TAG, "onLocationResult: " + AppConstants.range + " - " + dist);
//                Toast.makeText(StartSurveyActivity.this, AppConstants.range + " - " + dist, Toast.LENGTH_SHORT).show();
                if (dist > AppConstants.range && errorLayout.getVisibility() == View.GONE) {
                    errorLayout.setVisibility(View.VISIBLE);
                    button.setVisibility(View.GONE);
                    recyclerView.setVisibility(View.GONE);
                    countDownTimer.start();
                } else if (dist < AppConstants.range && errorLayout.getVisibility() == View.VISIBLE) {
                    errorLayout.setVisibility(View.GONE);
                    recyclerView.setVisibility(View.VISIBLE);
                    button.setVisibility(View.VISIBLE);
                    countDownTimer.cancel();
                }
            }
        }
    };

    CountDownTimer countDownTimer;

    private static final String TAG = "StartSurveyActivity";
    private int backPress = 0;
    private static final int REQUEST_IMAGE_CAPTURE = 11111;
    private ArrayList<Double> ratingList;
    private Map<String, ArrayList<String>> ratingWithQues;
    private ArrayList<QnA> qnaList;
    private String surveyId, collegeName;
    private RecyclerView recyclerView;
    private SurveyAdapter adapter;
    private Button button;
    private int category = -1;
    private DocumentReference docRef;
    private CollectionReference questionRef;
    private FirebaseFirestore db;
    private TextView categoryHead;
    private FloatingActionButton imageFAB;
    private ArrayList<Uri> uriList;
    String currentPhotoPath = null, image = "";
    ArrayList<String> downloadUrls;
    private EditText commentsEditText;
    private Map<String, String> commentsMap;
    private TextView coordinateTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_start_survey);

        surveyId = getIntent().getStringExtra("id");
        collegeName = getIntent().getStringExtra("collegeName");
        latitude = getIntent().getDoubleExtra("latitude", 0);
        longitude = getIntent().getDoubleExtra("longitude", 0);

        init();
        checkTedPermission();

        //initialize location request and client
        fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(this);
        locationRequest = LocationRequest.create();
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setInterval(4000);
        locationRequest.setFastestInterval(2000);

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                /*
                on button click two tasks should be performed
                1.  Get the ratings of questions of the current category
                2.  Load the questions of next category
                 */

                Log.d(TAG, "onClick: " + category);

                if (category == -1) {
                } else {
                    calculateRatings();
                    commentsMap.put(AppConstants.questionCategories.get(category), commentsEditText.getText().toString());
                    commentsEditText.setText("");
                }

                if (ratingList.size() == AppConstants.questionCategories.size()) {
                    Log.d(TAG, "onClick: got the list full n final" + ratingList);
                    putRatings(category);
                    submitComments();
                    submitSurvey(ratingList);
                }

                category++;
                if (category >= AppConstants.questionCategories.size()) {
                    return;
                }
                if (category > 0) {
                    putRatings(category - 1);

                }
                loadRecyclerView(category);
            }
        });

        countDownTimer = new CountDownTimer(22000, 1000) {
            @Override
            public void onTick(long l) {
                if (l / 1000 == 2) {
                    titleView.setBackgroundColor(getResources().getColor(R.color.app_red));
                    titleView.setText("CANCELLING SURVEY!");
                    descriptionView.setText("You failed to reach within perimeter. Cancelling survey to maintain authenticity!");
                    timerView.setText("Time Left\n 0 sec.");
                } else if (l / 1000 > 2) {
                    timerView.setText("Time Left\n" + (l / 1000 - 2) + " sec.");
                }
            }

            @Override
            public void onFinish() {
                Intent returnIntent = new Intent(StartSurveyActivity.this, MainActivity.class);
                returnIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(returnIntent);
            }
        };

        imageFAB.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dispatchTakePictureIntent();
            }
        });

    }

    private void submitComments() {
        db.collection("comments").document(surveyId).set(commentsMap).addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {
                Toast.makeText(StartSurveyActivity.this, "Failed to submit comments", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void dispatchTakePictureIntent() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        // Ensure that there's a camera activity to handle the intent
        if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
            // Create the File where the photo should go
            File photoFile = null;
            try {
                photoFile = createImageFile();
            } catch (IOException ex) {
            }
            // Continue only if the File was successfully created
            if (photoFile != null) {
                Uri photoURI = FileProvider.getUriForFile(this,
                        "com.example.android.fileprovider",
                        photoFile);
                takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE);
            }
        }
    }

    private File createImageFile() throws IOException {
        // Create an image file name
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";

        String folderPath = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES) + "/eSurvey";
        File folder = new File(folderPath);
        if (!folder.exists()) {
            File wallpaperDirectory = new File(folderPath);
            wallpaperDirectory.mkdirs();
        }

        File image = File.createTempFile(
                imageFileName,  /* prefix */
                ".jpg",         /* suffix */
                folder      /* directory */
        );

        // Save a file: path for use with ACTION_VIEW intents
        currentPhotoPath = image.getAbsolutePath();
        return image;
    }


    private void init() {
        coordinateTextView = findViewById(R.id.coordinates);

        qnaList = new ArrayList<>();
        recyclerView = findViewById(R.id.recyclerView);
        errorLayout = findViewById(R.id.errorLayout);
        timerView = findViewById(R.id.timerView);
        descriptionView = findViewById(R.id.dialogDesc);
        titleView = findViewById(R.id.dialogHeader);
        titleView.setBackgroundColor(getResources().getColor(R.color.app_orange));

        button = findViewById(R.id.next);
        adapter = new SurveyAdapter(this, qnaList, this, false);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);
        recyclerView.setNestedScrollingEnabled(false);

        db = FirebaseFirestore.getInstance();
        questionRef = db.collection(AppConstants.questionRef);

        categoryHead = findViewById(R.id.category);
        ratingList = new ArrayList<>();
        ratingWithQues = new HashMap<>();
//        correspondingRatings = new ArrayList<>();
        imageFAB = findViewById(R.id.imageFAB);
        uriList = new ArrayList<>();
        downloadUrls = new ArrayList<>();

        commentsEditText = findViewById(R.id.comments);
        commentsMap = new HashMap<>();
    }

    private void prepareQnA(ArrayList<String> questionsList) {
        qnaList.clear();
        for (String question : questionsList) {
            qnaList.add(new QnA(question));
        }
    }

    private void loadRecyclerView(final int cat) {
        try {
            docRef = questionRef.document(AppConstants.questionCategories.get(cat));
            docRef.get().addOnSuccessListener(new OnSuccessListener<DocumentSnapshot>() {
                @Override
                public void onSuccess(DocumentSnapshot documentSnapshot) {
                    if (documentSnapshot == null) {
                        Toast.makeText(StartSurveyActivity.this, "Error Retrieving", Toast.LENGTH_SHORT).show();
                    } else {
                        ArrayList<String> questionsList = (ArrayList<String>) documentSnapshot.getData().get("Questions");
                        prepareQnA(questionsList);
                        adapter.notifyDataSetChanged();
                        categoryHead.setText(AppConstants.questionCategories.get(category));
                        recyclerView.scrollToPosition(0);
                    }
                }
            });
        } catch (Exception e) {
            Toast.makeText(this, e.getMessage(), Toast.LENGTH_SHORT).show();
        }
        if (category == AppConstants.questionCategories.size() - 1) {
            button.setText("FINISH");
        }
    }

    //Old getCategories
//    private void getCategories() {
//        db.collection(AppConstants.questionRef).get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
//            @Override
//            public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
//                if (queryDocumentSnapshots == null) {
//                    Toast.makeText(StartSurveyActivity.this, "error", Toast.LENGTH_SHORT).show();
//                } else {
//                    AppConstants.questionCategories.clear();
//                    for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
//                        AppConstants.questionCategories.add(document.getId());
//                        Log.d(TAG, "onSuccess: " + document.getId());
//                    }
//                    button.performClick();
//                }
//            }
//        });
//    }

    private void getCategories(String type) {
        Log.e(TAG, "getCategories: " +type);
        Log.e(TAG, "getCategories: " +Arrays.asList(type));
        Query query = db.collection(AppConstants.questionRef).whereArrayContainsAny("Type", Arrays.asList(type));
        query.get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
            @Override
            public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
                if (queryDocumentSnapshots == null) {
                    Toast.makeText(StartSurveyActivity.this, "error", Toast.LENGTH_SHORT).show();
                } else {
                    AppConstants.questionCategories.clear();
                    for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                        AppConstants.questionCategories.add(document.getId());
                        Log.d(TAG, "onSuccess: " + document.getId());
                    }
                    button.performClick();
                }
            }
        });
    }

    private void getSurveyType() {
        Log.e(TAG, "getSurveyType: " + surveyId);
        db.collection(AppConstants.surveyRef).document(surveyId).get().addOnSuccessListener(new OnSuccessListener<DocumentSnapshot>() {
            @Override
            public void onSuccess(DocumentSnapshot documentSnapshot) {
                if (documentSnapshot.exists()) {
                    ArrayList<String> surveyTypes = (ArrayList<String>) documentSnapshot.getData().get("type");
//                    AppConstants.surveyType.add(surveyTypes.get(0));
                    Log.e(TAG, "getSurveyType: "+documentSnapshot.getData());
                    getCategories(surveyTypes.get(0));
                }
            }
        });
//        Log.e(TAG, "getSurveyType: " + AppConstants.surveyType.get(0));
    }

    @Override
    protected void onStart() {
        super.onStart();
        getSurveyType();
        if (ActivityCompat.checkSelfPermission(StartSurveyActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(StartSurveyActivity.this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            ActivityCompat.requestPermissions(StartSurveyActivity.this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                    LOCATION_REQUEST);
        } else {
            checkLocationSettings();
        }
    }

    @Override
    public void onRatingBarChange(QnA item, float value, int position) {
        Log.d(TAG, "onRatingBarChange: " + item.getQuestion());
        Log.d(TAG, "onRatingBarChange: " + qnaList.get(position).getRating());

        qnaList.get(position).setRating(Float.toString(value));

        Log.d(TAG, "onRatingBarChange: " + qnaList.get(position).getRating());
        Log.d(TAG, "onRatingBarChange: ---------------------------------");
    }

    @Override
    public void onBackPressed() {
        backPress++;
        if (backPress == 1) {
            Toast.makeText(this, "Press again to exit!\n\nAll progress will be lost", Toast.LENGTH_SHORT).show();
        } else {
            finish();
            //            Intent intent = new Intent(StartSurveyActivity.this, PendingSurveyActivity.class);
//            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
//            startActivity(intent);
        }
    }

    private void calculateRatings() {
        double score = 0;
        for (QnA qna : qnaList) {
            score += Double.parseDouble(qna.getRating());
        }
        DecimalFormat df = new DecimalFormat("#.##");
        ratingList.add(Double.parseDouble(df.format(score / qnaList.size())));
        Log.d(TAG, "onClick: " + ratingList);
    }

    private void putRatings(int category) {
        ArrayList<String> correspondingRatings = new ArrayList<>();
        for (QnA qna : qnaList) {
            StringBuilder sb = new StringBuilder();
            sb.append(qna.getQuestion());
            sb.append("_");
            sb.append(qna.getRating());
            correspondingRatings.add(sb.toString());
            sb.setLength(0);
        }
        ratingWithQues.put(AppConstants.questionCategories.get(category), correspondingRatings);
    }

    private void saveRatings() {
        Log.d(TAG, "saveRatings: " + ratingWithQues.keySet());
        CollectionReference ref = db.collection("question_wise_ratings");
        ref.document(surveyId).set(ratingWithQues).addOnSuccessListener(new OnSuccessListener<Void>() {
            @Override
            public void onSuccess(Void aVoid) {
                Intent intent = new Intent(StartSurveyActivity.this, ImageUploadActivity.class);
                intent.putExtra("surveyId", surveyId);
                intent.putExtra("collegeName", collegeName);
                startActivity(intent);
                finish();
//                finishDialog(StartSurveyActivity.this);
            }
        });
    }

    private void submitSurvey(ArrayList<Double> scores) {
        /*
        Update score of each category and change status to completed
         */
        DocumentReference survey = db.collection(AppConstants.surveyRef).document(surveyId);
        Map<String, Object> map = new HashMap<>();
        map.put("scoreOfTeaching", scores);
        map.put("status", "completed");
        map.put("dateOfSurvey", AppUtils.dateToString(new Date(System.currentTimeMillis()), "dd-MMMM-yy"));
        survey.update(map).addOnSuccessListener(new OnSuccessListener<Void>() {
            @Override
            public void onSuccess(Void aVoid) {
//                finishDialog(StartSurveyActivity.this);
//                uploadImages();
                saveRatings();
            }
        });
    }

    public void finishDialog(final Context context) {
        final AlertDialog.Builder dialog = new AlertDialog.Builder(context);
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.layout_dialog, null, false);

        TextView dialogText = view.findViewById(R.id.dialog_text);
        ImageView dialogImage = view.findViewById(R.id.dialog_image);

        dialogImage.setVisibility(View.GONE);

        dialogText.setText("Survey has been completed successfully!");
        dialogText.setTextSize(20);

        dialog.setView(view).setCancelable(false)
                .setNegativeButton("Ok", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialogInterface, int i) {
                        dialogInterface.dismiss();
                        stopLocationUpdates();
                        Intent returnIntent = new Intent(context, MainActivity.class);
                        returnIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(returnIntent);
                    }
                });
        dialog.show();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                checkLocationSettings();
            }
        }
    }

    private void checkLocationSettings() {
        LocationSettingsRequest request = new LocationSettingsRequest.Builder().addLocationRequest(locationRequest).build();
        SettingsClient client = LocationServices.getSettingsClient(this);
        Task<LocationSettingsResponse> locationSettingsResponseTask = client.checkLocationSettings(request);
        locationSettingsResponseTask.addOnSuccessListener(new OnSuccessListener<LocationSettingsResponse>() {
            @Override
            public void onSuccess(LocationSettingsResponse locationSettingsResponse) {
                startLocationUpdates();
            }
        }).addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {
                if (e instanceof ResolvableApiException) {
                    ResolvableApiException apiException = (ResolvableApiException) e;
                    try {
                        apiException.startResolutionForResult(StartSurveyActivity.this, 1001);
                    } catch (IntentSender.SendIntentException e1) {
                        e1.printStackTrace();
                    }
                }
            }
        });
    }

    private void startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        fusedLocationProviderClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper());
    }

    private void stopLocationUpdates() {
        fusedLocationProviderClient.removeLocationUpdates(locationCallback);
    }

    public void checkTedPermission() {
        PermissionListener permissionListener = new PermissionListener() {
            @Override
            public void onPermissionGranted() {
//                Toast.makeText(MainActivity.this, "Permission Granted", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onPermissionDenied(List<String> deniedPermissions) {
                Toast.makeText(StartSurveyActivity.this, "Permission Denied", Toast.LENGTH_SHORT).show();
            }
        };

        TedPermission.with(StartSurveyActivity.this)
                .setPermissionListener(permissionListener)
                .setPermissions(Manifest.permission.CAMERA, Manifest.permission.READ_EXTERNAL_STORAGE,
                        Manifest.permission.WRITE_EXTERNAL_STORAGE, Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION)
                .check();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK) {
            File f = new File(currentPhotoPath);
            Uri imageUri = Uri.fromFile(f);
            uriList.add(imageUri);
            Toast.makeText(this, "Image Selected", Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, "Error in getting image", Toast.LENGTH_SHORT).show();
        }

    }


    Map<String, Object> map;

    private void uploadImages() {
        FirebaseStorage storage = FirebaseStorage.getInstance();
        StorageReference storageRef = storage.getReference();
        final ProgressDialog progressDialog = new ProgressDialog(this);
        progressDialog.setTitle("Uploading Images");
        progressDialog.setMessage("Image uploaded: 0/" + uriList.size());
        progressDialog.show();
        Log.d(TAG, "uploadImages: " + uriList);
        final CollectionReference imageRef = db.collection(AppConstants.imagesRef);
        map = new HashMap<>();
        map.put("surveyId", surveyId);
        map.put("collegeName", collegeName);
        int count = 0;
        for (Uri uri : uriList) {
            count++;
            final Uri imageUri = uri;
            final StorageReference surveyRef = storageRef.child("survey_images/" + uri.getLastPathSegment());
            UploadTask uploadTask = surveyRef.putFile(uri);
            Task<Uri> urlTask = uploadTask.continueWithTask(new Continuation<UploadTask.TaskSnapshot, Task<Uri>>() {
                @Override
                public Task<Uri> then(@NonNull Task<UploadTask.TaskSnapshot> task) throws Exception {
                    if (!task.isSuccessful()) {
                        throw task.getException();
                    }
                    return surveyRef.getDownloadUrl();
                }
            }).addOnCompleteListener(new OnCompleteListener<Uri>() {
                @Override
                public void onComplete(@NonNull Task<Uri> task) {
                    if (task.isSuccessful()) {
                        Uri downloadUri = task.getResult();
                        Log.d(TAG, "onComplete: " + downloadUri);
                        Log.d(TAG, "onComplete: " + downloadUri.toString());

                        downloadUrls.add(downloadUri.toString());
                        AppConstants.imageURLS.add(downloadUri.toString());
                        imageRef.document(surveyId).collection("urls").document();

//                        Map<String, String> imageMap = new HashMap<>();
//                        map.put("url",downloadUri.getPath());
//                        Log.d(TAG, "onComplete: "+imageMap);
//                        imageRef.document(surveyId).collection("urls").add(imageMap);
//                        downloadUrls.add(downloadUri.toString());
//
//                        map.put("images",downloadUrls);
//                        imageRef.document(surveyId).set(map);
                    } else {
                    }
                    progressDialog.setMessage("Image Uploaded: " + uriList.indexOf(imageUri) + "/" + uriList.size());
                }
            });
        }


        Log.d(TAG, "uploadImages: " + downloadUrls);
        Log.d(TAG, "uploadImages: appconst" + AppConstants.imageURLS);
        progressDialog.hide();
//        finishDialog(this);
//        saveRatings();
    }
}

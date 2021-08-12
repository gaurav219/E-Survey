package com.cseip19.esurvey;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.cseip19.esurvey.my_utils.AppConstants;
import com.cseip19.esurvey.my_utils.SurveyAdapter;
import com.google.android.gms.tasks.Continuation;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.OnProgressListener;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.File;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class ImageUploadActivity extends AppCompatActivity {
    private static final String TAG = "ImageUploadLog";
    String currentPhotoPath = null;
    private static final int REQUEST_IMAGE_CAPTURE = 11111;
    public static final int PICK_IMAGE = 22222;
    public static final int PICK_VIDEO = 33333;
    private ArrayList<Uri> uriList;
    private RecyclerView recyclerView;
    private ImageAdapter adapter;
    private String surveyId, collegeName;
    int count = 0, nof = 0;
    private TextView summaryTextView;
    DecimalFormat df = new DecimalFormat("###.##");
    ProgressDialog progressDialog;
    CollectionReference imageRef = FirebaseFirestore.getInstance().collection(AppConstants.imagesRef);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_image_upload);

        surveyId = getIntent().getStringExtra("surveyId");
        collegeName = getIntent().getStringExtra("collegeName");

        FloatingActionButton videoFab = findViewById(R.id.imageFAB0);
        FloatingActionButton galleryFab = findViewById(R.id.imageFAB1);
        FloatingActionButton cameraFab = findViewById(R.id.imageFAB2);
        Button button = findViewById(R.id.finish);

        uriList = new ArrayList<>();
        recyclerView = findViewById(R.id.imagesRecyclerView);
        adapter = new ImageAdapter(this, uriList);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);
        adapter.notifyDataSetChanged();
        summaryTextView = findViewById(R.id.textview2);

        cameraFab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (count == 0) {
                    Map<String, String> detailsMap = new HashMap<>();
                    detailsMap.put("surveyId", surveyId);
                    detailsMap.put("collegeName", collegeName);
                    imageRef.document(surveyId).set(detailsMap);
                }
                count++;
                dispatchTakePictureIntent();
            }
        });

        galleryFab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (count == 0) {
                    Map<String, String> detailsMap = new HashMap<>();
                    detailsMap.put("surveyId", surveyId);
                    detailsMap.put("collegeName", collegeName);
                    imageRef.document(surveyId).set(detailsMap);
                }
                count++;
                picFromGallery();
            }
        });

        videoFab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (count == 0) {
                    Map<String, String> detailsMap = new HashMap<>();
                    detailsMap.put("surveyId", surveyId);
                    detailsMap.put("collegeName", collegeName);
                    imageRef.document(surveyId).set(detailsMap);
                }
                count++;
                videoFromGallery();
            }
        });

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(ImageUploadActivity.this, MainActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
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

    private void picFromGallery() {
        Intent intent = new Intent();
        intent.setType("image/*");
        intent.setAction(Intent.ACTION_GET_CONTENT);
        startActivityForResult(Intent.createChooser(intent, "Select Picture"), PICK_IMAGE);
    }

    private void videoFromGallery() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Video.Media.EXTERNAL_CONTENT_URI);
//        intent.setType("video/*");
//        intent.setAction(Intent.ACTION_GET_CONTENT);
        startActivityForResult(Intent.createChooser(intent,"Select Video"),PICK_VIDEO);
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

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK) {
            File f = new File(currentPhotoPath);
            Uri imageUri = Uri.fromFile(f);
            uriList.add(imageUri);
            adapter.notifyDataSetChanged();
            Log.d(TAG, "onActivityResult: " + uriList);
            uploadImage(imageUri);
            Toast.makeText(this, "Image Selected", Toast.LENGTH_SHORT).show();

        } else if (requestCode == PICK_IMAGE && resultCode == RESULT_OK && data != null) {
            Uri selectedImage = data.getData();
            uriList.add(selectedImage);
            adapter.notifyDataSetChanged();
            uploadImage(selectedImage);
        } else if (requestCode == PICK_VIDEO && resultCode == RESULT_OK && data != null) {
            Uri selectedVideo = data.getData();
            String path = getPath(selectedVideo);
            Log.d(TAG, "onActivityResult: " + path);
//            uploadImage(selectedVideo);
        } else {
            Toast.makeText(this, "Error in getting image", Toast.LENGTH_SHORT).show();
        }
    }

    public String getPath(Uri uri) {
        String[] projection = {MediaStore.Video.Media.DATA};
        Cursor cursor = getContentResolver().query(uri, projection, null, null, null);
        if (cursor != null) {
            // HERE YOU WILL GET A NULLPOINTER IF CURSOR IS NULL
            // THIS CAN BE, IF YOU USED OI FILE MANAGER FOR PICKING THE MEDIA
            int column_index = cursor
                    .getColumnIndexOrThrow(MediaStore.Video.Media.DATA);
            cursor.moveToFirst();
            return cursor.getString(column_index);
        } else
            return null;
    }

    private void uploadImage(Uri uri) {
        progressDialog = new ProgressDialog(this);
        progressDialog.setTitle("Uploading");
        progressDialog.setMessage("Please Wait...");
        progressDialog.show();
        FirebaseStorage storage = FirebaseStorage.getInstance();
        StorageReference storageRef = storage.getReference();
        final StorageReference surveyRef = storageRef.child("survey_images/" + uri.getLastPathSegment());
        UploadTask uploadTask = surveyRef.putFile(uri);

        uploadTask.addOnProgressListener(new OnProgressListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onProgress(UploadTask.TaskSnapshot taskSnapshot) {
                double progress = (100.0 * taskSnapshot.getBytesTransferred()) / taskSnapshot.getTotalByteCount();
                double uploaded = taskSnapshot.getBytesTransferred() / 1048576.00;
                double total = taskSnapshot.getTotalByteCount() / 1048576.00;
                progressDialog.setTitle("Uploading File... " + df.format(uploaded) + "/" + df.format(total) + " MB");
                progressDialog.setMessage("Upload is " + df.format(progress) + "% done");
            }
        });

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
                progressDialog.hide();
                if (task.isSuccessful()) {
                    Uri downloadUri = task.getResult();
                    Map<String, String> data = new HashMap<>();
                    data.put("url", downloadUri.toString());
                    imageRef.document(surveyId).collection("images").document().set(data);
                    nof++;
                    summaryTextView.setText("Number of files uploaded: " + nof);

                } else {
                    Toast.makeText(ImageUploadActivity.this, task.getException().getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    static class ImageAdapter extends RecyclerView.Adapter<ImageAdapter.ViewHolder> {
        private Context mContext;
        private ArrayList<Uri> mImageUris;

        public ImageAdapter(Context mContext, ArrayList<Uri> mImageUris) {
            this.mContext = mContext;
            this.mImageUris = mImageUris;
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.layout_images, parent, false);
            return new ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            Uri imageUri = mImageUris.get(position);
            holder.imageView.setImageURI(imageUri);
            Log.d(TAG, "onBindViewHolder: " + mImageUris.get(position));
        }

        @Override
        public int getItemCount() {
            return mImageUris.size();
        }

        static class ViewHolder extends RecyclerView.ViewHolder {
            private ImageView imageView;

            public ViewHolder(@NonNull View itemView) {
                super(itemView);
                imageView = itemView.findViewById(R.id.image);
            }
        }

    }
}
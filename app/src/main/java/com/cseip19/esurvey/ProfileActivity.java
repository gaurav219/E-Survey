package com.cseip19.esurvey;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.widget.TextView;

import com.cseip19.esurvey.my_utils.CurrentUser;
import com.google.firebase.firestore.FirebaseFirestore;

import de.hdodenhof.circleimageview.CircleImageView;

public class ProfileActivity extends AppCompatActivity {

    TextView nameTextView, phoneTextView, emailTextView, ageTextView;
    CircleImageView userImageView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        bindViews();
        populateUserDetails();
    }

    private void bindViews(){
        nameTextView = findViewById(R.id.userName);
        phoneTextView = findViewById(R.id.userPhone);
        emailTextView = findViewById(R.id.email);
        userImageView = findViewById(R.id.userImage);
        ageTextView = findViewById(R.id.age);
    }

    void populateUserDetails(){
        StringBuilder sb = new StringBuilder();
        sb.append(CurrentUser.getFirstname());
        sb.append(" ");
        sb.append(CurrentUser.getMiddlename());
        sb.append(" ");
        sb.append(CurrentUser.getLastname());
        nameTextView.setText(sb.toString());
        phoneTextView.setText(CurrentUser.getContactNumber());
        emailTextView.setText(CurrentUser.getGmailID());
        ageTextView.setText(CurrentUser.getAge());
    }
}
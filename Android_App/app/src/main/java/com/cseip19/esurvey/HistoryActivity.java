package com.cseip19.esurvey;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.cseip19.esurvey.my_utils.AppConstants;
import com.cseip19.esurvey.my_utils.CompletedSurveyAdapter;
import com.cseip19.esurvey.my_utils.Survey;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;

import java.util.ArrayList;

public class HistoryActivity extends AppCompatActivity {

    private static final String TAG = "HistoryActivity";
    private FirebaseFirestore db;
    private CollectionReference surveyRef;
    private ArrayList<String> ratingsList;
    private CompletedSurveyAdapter mAdapter;
    private RecyclerView recyclerView;
    private TextView categoryHead;
    private Button button;
    private int category = -1;
    private ArrayList<Double> scoreOfTeaching;
    private String surveyId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_history);

        init();

        getSupportActionBar().setTitle("Survey Result");

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                /*
                on button click two tasks should be performed
                1.  Get the ratings of questions of the current category
                2.  Load the questions of next category
                 */
                category++;
                Log.d(TAG, "onClick: " + category);
                Log.d(TAG, "onClick: " + AppConstants.questionCategories);
//                Log.d(TAG, "onClick: " + AppConstants.questionCategories.get(category));
//                Log.d(TAG, "onClick: " + scoreOfTeaching.get(category));
                if (category >= AppConstants.questionCategories.size()) {
//                    Intent intent = new Intent(HistoryActivity.this, PendingSurveyActivity.class);
//                    intent.putExtra("status", "completed");
//                    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK|Intent.FLAG_ACTIVITY_NEW_TASK);
//                    startActivity(intent);
                    finish();
                } else {
                    loadRecyclerView(category);
                }
            }
        });
    }

    private void init() {
        db = FirebaseFirestore.getInstance();
        surveyRef = db.collection(getString(R.string.survey_ref));
        ratingsList = new ArrayList<>();
        recyclerView = findViewById(R.id.recyclerView2);
        mAdapter = new CompletedSurveyAdapter(this, ratingsList);
        recyclerView.setAdapter(mAdapter);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        categoryHead = findViewById(R.id.category);
        button = findViewById(R.id.next_history);
        scoreOfTeaching = new ArrayList<>();
    }

    private void loadRecyclerView(final int category) {
        DocumentReference docRef;
        ratingsList.clear();
        try {
            docRef = db.collection(AppConstants.questionWiseRatingsRef).document(surveyId);
            docRef.get().addOnSuccessListener(new OnSuccessListener<DocumentSnapshot>() {
                @Override
                public void onSuccess(DocumentSnapshot documentSnapshot) {
                    if (documentSnapshot == null) {
                        Toast.makeText(HistoryActivity.this, "Error Retrieving", Toast.LENGTH_SHORT).show();
                    } else {
                        Log.d(TAG, "onSuccess: got snapshot");
//                        Log.d(TAG, "onSuccess: "+ documentSnapshot.getData());
//                        Log.d(TAG, "onSuccess: " + documentSnapshot.getData().get(AppConstants.questionCategories.get(category)));
                        ArrayList<String> list = (ArrayList<String>) documentSnapshot.getData().get(AppConstants.questionCategories.get(category));
                        ratingsList.addAll(list);
                        Log.d(TAG, "onSuccess: " + ratingsList);
                        mAdapter.notifyDataSetChanged();
                        categoryHead.setText(AppConstants.questionCategories.get(category) + " - " +
                                scoreOfTeaching.get(category));
//                        recyclerView.scrollToPosition(0);
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

    @Override
    protected void onStart() {
        super.onStart();
        String str = getIntent().getStringExtra("scores");
        String[] arr = str.split("_");
        for (String s : arr) {
            scoreOfTeaching.add(Double.parseDouble(s));
        }
        surveyId = getIntent().getStringExtra("id");

        getCategories();
    }

    private void getCategories() {
        db.collection(AppConstants.questionRef).get().addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
            @Override
            public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
                if (queryDocumentSnapshots == null) {
                    Toast.makeText(HistoryActivity.this, "error", Toast.LENGTH_SHORT).show();
                } else {
                    AppConstants.questionCategories.clear();
                    for (QueryDocumentSnapshot document : queryDocumentSnapshots) {
                        AppConstants.questionCategories.add(document.getId());
//                        Log.d(TAG, "onSuccess: " + document.getId());
                    }
                    button.performClick();
                }
            }
        });
    }
}

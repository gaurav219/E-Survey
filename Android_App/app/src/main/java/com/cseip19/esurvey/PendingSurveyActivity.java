package com.cseip19.esurvey;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.cseip19.esurvey.my_utils.AppConstants;
import com.cseip19.esurvey.my_utils.AppUtils;
import com.cseip19.esurvey.my_utils.CurrentUser;
import com.cseip19.esurvey.my_utils.Survey;
import com.cseip19.esurvey.my_utils.SurveyListAdapter;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.Timestamp;
import com.google.firebase.firestore.CollectionReference;
import com.google.firebase.firestore.EventListener;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.FirebaseFirestoreException;
import com.google.firebase.firestore.GeoPoint;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;

/*
    This activity is used to retrieve records from the firestore database and load the data in a recycler view.
    For pending surveys as well as completed surveys, this activity is sufficient to display both.

    By swiping the items of recycler view we can open navigation to the college for a particular record.
    By clicking on item of recycler view
        TODO: For pending survey: Activity to fill the form will start
        TODO: For survey history: Activity to display all ratings will start
 */

public class PendingSurveyActivity extends AppCompatActivity implements SurveyListAdapter.OnSurveyListener {
    private static final String TAG = "PendingSurveyActivity";
    private FirebaseFirestore db;
    private CollectionReference surveyRef;
    private ArrayList<Survey> surveyArrayList;
    private SurveyListAdapter mAdapter;
    private RecyclerView recyclerView;
    private String status;
    private TextView emptyView;
    private String color;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pending_survey);

        if (getIntent().hasExtra("status")) {
            if (getIntent().getStringExtra("status").equals("completed")) {
                getSupportActionBar().setTitle("Completed Surveys");
                color = "#7cb342";
            } else {
                getSupportActionBar().setTitle("Pending Surveys");
                color = "#fdad5c";
            }

        } else {
            getSupportActionBar().setTitle("Pending Surveys");
            color = "#fdad5c";
        }

        init();

        if (getIntent().getStringExtra("status").equals("completed")) {
            recyclerView.setBackgroundColor(Color.parseColor("#f1f8e9"));
        }


        Log.d(TAG, "onCreate: " + CurrentUser.getGmailID());
        Log.d(TAG, "onCreate: " + AppConstants.latitude + "," + AppConstants.longitude);

        if (getIntent().hasExtra("status")) {
            status = getIntent().getStringExtra("status");
        }

        getSurveys();
    }

    @Override
    protected void onStart() {
        super.onStart();
        AppUtils.getRange();
        getSurveys();
    }

    private void init() {
        db = FirebaseFirestore.getInstance();
        surveyRef = db.collection(getString(R.string.survey_ref));
        surveyArrayList = new ArrayList<>();
        recyclerView = findViewById(R.id.recycler);
        mAdapter = new SurveyListAdapter(this, surveyArrayList, this, color);
        recyclerView.setAdapter(mAdapter);
        new ItemTouchHelper(itemSimpleCallback).attachToRecyclerView(recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        emptyView = findViewById(R.id.emptyView);
    }

    private void getSurveys() {
        surveyRef.whereEqualTo("status", status)
                .whereEqualTo("visitorId", CurrentUser.getGmailID())
                .addSnapshotListener(new EventListener<QuerySnapshot>() {
                    @Override
                    public void onEvent(@Nullable QuerySnapshot value, @Nullable FirebaseFirestoreException error) {
                        if (value.isEmpty()) {
                            emptyView.setVisibility(View.VISIBLE);
//                            Toast.makeText(PendingSurveyActivity.this, "No Pending Surveys", Toast.LENGTH_SHORT).show();
                        } else {
                            emptyView.setVisibility(View.GONE);
                            surveyArrayList.clear();
                            for (QueryDocumentSnapshot document : value) {
                                Log.d(TAG, "onSuccess: " + document.getData());
                                Survey survey = document.toObject(Survey.class);
                                Log.e(TAG, "onEvent: Geopoint survey" + survey.getLocation());
                                Log.e(TAG, "onEvent: Geopoint location" + AppConstants.latitude + "-" + AppConstants.longitude);
                                survey.setDistance(AppUtils.distance(survey.getLocation().getLatitude(), AppConstants.latitude,
                                        survey.getLocation().getLongitude(), AppConstants.longitude));
                                surveyArrayList.add(survey);
                            }
                            Collections.sort(surveyArrayList, new Comparator<Survey>() {
                                @Override
                                public int compare(Survey survey, Survey t1) {
                                    return Double.compare(survey.getDistance(), t1.getDistance());
                                }
                            });
                            Collections.sort(surveyArrayList, new Comparator<Survey>() {
                                @Override
                                public int compare(Survey survey, Survey t1) {
                                    return survey.getAssignDate().compareTo(t1.getAssignDate());
                                }
                            });
                            mAdapter.notifyDataSetChanged();
                        }
                    }
                });
    }

    ItemTouchHelper.SimpleCallback itemSimpleCallback = new ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.RIGHT) {
        @Override
        public boolean onMove(@NonNull RecyclerView recyclerView, @NonNull RecyclerView.ViewHolder viewHolder, @NonNull RecyclerView.ViewHolder target) {
            return false;
        }

        @Override
        public void onSwiped(@NonNull RecyclerView.ViewHolder viewHolder, int direction) {
            Survey survey = surveyArrayList.get(viewHolder.getAdapterPosition());
            StringBuffer buffer = new StringBuffer();
            buffer.append(survey.getLocation().getLatitude());
            buffer.append(",");
            buffer.append(survey.getLocation().getLongitude());
            String param = buffer.toString();
            Intent intent = new Intent(android.content.Intent.ACTION_VIEW,
                    Uri.parse("http://maps.google.com/maps?daddr=" + param));
            startActivity(intent);
            mAdapter.notifyItemChanged(viewHolder.getAdapterPosition());
        }

        @Override
        public void onChildDraw(@NonNull Canvas c, @NonNull RecyclerView recyclerView, @NonNull RecyclerView.ViewHolder viewHolder, float dX, float dY, int actionState, boolean isCurrentlyActive) {
            try {
                Bitmap icon;
                if (actionState == ItemTouchHelper.ACTION_STATE_SWIPE) {
                    View itemView = viewHolder.itemView;
                    float height = (float) itemView.getBottom() - (float) itemView.getTop();
                    float width = height / 5;
                    viewHolder.itemView.setTranslationX(dX / 5);
                    Paint paint = new Paint();
                    paint.setColor(Color.parseColor("#000"));
                    RectF background = new RectF((float) itemView.getRight() + dX / 5, (float) itemView.getTop(), (float) itemView.getRight(), (float) itemView.getBottom());
                    c.drawRect(background, paint);
                    icon = BitmapFactory.decodeResource(getResources(), R.drawable.nav);
                    RectF icon_dest = new RectF((float) (itemView.getRight() + dX / 7), (float) itemView.getTop() + width, (float) itemView.getRight() + dX / 20, (float) itemView.getBottom() - width);
                    c.drawBitmap(icon, null, icon_dest, paint);
                } else {
                    super.onChildDraw(c, recyclerView, viewHolder, dX, dY, actionState, isCurrentlyActive);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    };

    @Override
    public void onSurveyClick(int position) {
        Intent intent;
        if (status.equals("completed")) {
            Log.d(TAG, "onSurveyClick: should come here");
            intent = new Intent(this, HistoryActivity.class);
            Survey survey = surveyArrayList.get(position);
            intent.putExtra("size", survey.getScoreOfTeaching().size());
            String scores = "";
            for (int i = 0; i < survey.getScoreOfTeaching().size(); i++) {
                scores += survey.getScoreOfTeaching().get(i) + "_";
            }
            intent.putExtra("scores", scores);
        } else {
            Log.d(TAG, "onSurveyClick: here");
            intent = new Intent(this, StartSurveyActivity.class);
//            intent = new Intent(this, ImageUploadActivity.class);
            Date date;
            try {
                date = new Date(Calendar.getInstance().getTimeInMillis());
                if (surveyArrayList.get(position).getAssignDate().compareTo(new Timestamp(date)) > 0) {
                    finishDialog("This survey is scheduled for some later day!", this);
                    return;
                }
            } catch (Exception e) {
                return;
            }

            if (surveyArrayList.get(position).getDistance() > AppConstants.range) {
                finishDialog("You are not in range of institution to start survey!", this);
                return;
            }
        }
        intent.putExtra("id", surveyArrayList.get(position).getId());
        intent.putExtra("collegeName",surveyArrayList.get(position).getCollegeName());
        intent.putExtra("latitude", surveyArrayList.get(position).getLocation().getLatitude());
        intent.putExtra("longitude", surveyArrayList.get(position).getLocation().getLongitude());
        startActivity(intent);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
    }

    public void finishDialog(String text, final Context context) {
        final AlertDialog.Builder dialog = new AlertDialog.Builder(context);
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.layout_dialog, null, false);

        TextView dialogText = view.findViewById(R.id.dialog_text);
        ImageView dialogImage = view.findViewById(R.id.dialog_image);

        dialogImage.setVisibility(View.GONE);

        dialogText.setText(text);
//        dialogText.setText("");
        dialogText.setTextSize(20);

        dialog.setView(view).setCancelable(false)
                .setNegativeButton("Ok", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialogInterface, int i) {
                        dialogInterface.dismiss();
                    }
                });
        dialog.show();
    }
}

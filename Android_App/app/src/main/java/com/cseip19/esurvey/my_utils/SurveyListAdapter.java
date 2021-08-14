package com.cseip19.esurvey.my_utils;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.cseip19.esurvey.R;

import java.util.ArrayList;
import java.util.Date;

public class SurveyListAdapter extends RecyclerView.Adapter<SurveyListAdapter.ViewHolder> {
    private static final String TAG = "SurveyAdapter";
    private Context context;
    private ArrayList<Survey> surveyArrayList;
    private OnSurveyListener onSurveyListener;
    private String color;

    public SurveyListAdapter(Context context, ArrayList<Survey> surveyArrayList, OnSurveyListener onSurveyListener, String color) {
        this.context = context;
        this.surveyArrayList = surveyArrayList;
        this.onSurveyListener = onSurveyListener;
        this.color = color;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.layout_survey_list, parent, false);
        return new ViewHolder(view, onSurveyListener);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        final Survey survey = surveyArrayList.get(position);
        StringBuilder sb = new StringBuilder();

        sb.append("College: ");
        sb.append(survey.getCollegeName());
        holder.college.setText(sb.toString());

        sb = new StringBuilder();
        Date date;
        try {
            date = survey.getAssignDate().toDate();
            sb.append("Assign Date: ");
            sb.append(AppUtils.dateToString(date, "dd-MMM-yyyy"));
        } catch (Exception e) {

        }
        holder.time.setText(sb.toString());

        holder.visitor.setText(survey.getVisitorId());

        double dist = survey.getDistance();
        String distanceText;
        if (dist > 1000) {
            dist = dist / 1000;
            distanceText = String.format("%.3f", dist) + " km away";
        } else {
            distanceText = String.format("%.0f", dist) + " metres away";
        }
        holder.distance.setText(distanceText);
    }

    @Override
    public int getItemCount() {
        return surveyArrayList.size();
    }

    class ViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener {

        private TextView time, college, visitor, distance;
        private RelativeLayout parentView;
        OnSurveyListener onSurveyListener;

        public ViewHolder(@NonNull View itemView, OnSurveyListener onSurveyListener) {
            super(itemView);

            parentView = itemView.findViewById(R.id.parent);
            parentView.setBackgroundColor(Color.parseColor(color));
            time = itemView.findViewById(R.id.timestamp);
            college = itemView.findViewById(R.id.college);
            visitor = itemView.findViewById(R.id.visitor);
            distance = itemView.findViewById(R.id.distance);
            this.onSurveyListener = onSurveyListener;
            itemView.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {
            onSurveyListener.onSurveyClick(getAdapterPosition());
        }
    }

    public interface OnSurveyListener {
        void onSurveyClick(int position);
    }
}

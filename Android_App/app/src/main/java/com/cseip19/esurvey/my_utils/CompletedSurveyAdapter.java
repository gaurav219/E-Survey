package com.cseip19.esurvey.my_utils;

import android.content.Context;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RatingBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.cseip19.esurvey.R;

import java.util.ArrayList;

public class CompletedSurveyAdapter extends RecyclerView.Adapter<CompletedSurveyAdapter.ViewHolder> {
    private static final String TAG = "CompletedSurveyAdapter";
    private Context context;
    private ArrayList<String> ratingsList;

    public CompletedSurveyAdapter(Context context, ArrayList<String> ratingsList) {
        this.context = context;
        this.ratingsList = ratingsList;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.layout_survey, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Log.d(TAG, "onBindViewHolder: "+ ratingsList.get(position));
        String question = ratingsList.get(position).split("_")[0];
        String rating = ratingsList.get(position).split("_")[1];
        holder.questionTextView.setText(question);
        holder.ratingBar.setRating(Float.parseFloat(rating));
    }

    @Override
    public int getItemCount() {
        return ratingsList.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView questionTextView;
        RatingBar ratingBar;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            questionTextView = itemView.findViewById(R.id.question);
            ratingBar = itemView.findViewById(R.id.ratingBar);
            ratingBar.setIsIndicator(true);
            Drawable drawable = ratingBar.getProgressDrawable();
            drawable.setColorFilter(Color.parseColor("#e27e07"), PorterDuff.Mode.SRC_ATOP);
        }
    }
}

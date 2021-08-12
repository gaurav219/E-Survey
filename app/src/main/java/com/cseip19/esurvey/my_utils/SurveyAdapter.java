package com.cseip19.esurvey.my_utils;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RatingBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.cseip19.esurvey.R;

import java.util.ArrayList;

public class SurveyAdapter extends RecyclerView.Adapter<SurveyAdapter.ViewHolder> {
    public static float total = 0;
    private Context context;
    private static ArrayList<QnA> list;
    private OnRecordEventListener listener;
    private boolean isIndicator;

    public SurveyAdapter(Context context, ArrayList<QnA> list, OnRecordEventListener listener, boolean isIndicator) {
        this.context = context;
        this.list = list;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.layout_survey, parent, false);
        return new ViewHolder(view, listener, isIndicator);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, final int position) {
        QnA qna = list.get(position);
        holder.questionTextView.setText(qna.getQuestion());
        holder.ratingBar.setRating(Float.parseFloat(qna.getRating()));

//        holder.ratingBar.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
//            @Override
//            public void onRatingChanged(RatingBar ratingBar, float v, boolean b) {
//                list.get(position).setRating(String.valueOf(ratingBar.getRating()));
//            }
//        });
    }

    @Override
    public int getItemCount() {
        return list.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {

        private TextView questionTextView;
        private RatingBar ratingBar;

        ViewHolder(@NonNull View itemView, final OnRecordEventListener listener, boolean isIndicator) {
            super(itemView);

            questionTextView = itemView.findViewById(R.id.question);
            ratingBar = itemView.findViewById(R.id.ratingBar);
            ratingBar.setIsIndicator(isIndicator);
            ratingBar.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
                @Override
                public void onRatingChanged(RatingBar ratingBar, float v, boolean b) {
                    listener.onRatingBarChange(list.get(getLayoutPosition()), v, getLayoutPosition());
                }
            });
        }
    }

    public interface OnRecordEventListener  {
        void onRatingBarChange(QnA item,float value, int position);
    }
}

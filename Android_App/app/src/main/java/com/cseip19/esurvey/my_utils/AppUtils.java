package com.cseip19.esurvey.my_utils;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.text.TextUtils;
import android.util.Patterns;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.cseip19.esurvey.R;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.EventListener;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.FirebaseFirestoreException;

import java.text.SimpleDateFormat;
import java.util.Date;

public class AppUtils {

    public static boolean isValidEmail(CharSequence target) {
        return (!TextUtils.isEmpty(target) && Patterns.EMAIL_ADDRESS.matcher(target).matches());
    }

    /**
     * @param lat1 latitude of first coordinate
     * @param lat2 latitude of second coordinate
     * @param lon1 longitude of first coordinate
     * @param lon2 longitude of second coordinate
     * @return distance between the coordinates
     */

    public static double distance(double lat1, double lat2, double lon1, double lon2) {

        final int R = 6371; // Radius of the earth

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c * 1000; // convert to meters
        return distance;
//        double height = el1 - el2;

//        distance = Math.pow(distance, 2) + Math.pow(height, 2);

//        return Math.sqrt(distance);

    }

    public static AlertDialog.Builder nonDismissableDialog(String text, int imgRes, Context context) {
        AlertDialog.Builder dialog = new AlertDialog.Builder(context);
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.layout_dialog, null, false);

        TextView dialogText = view.findViewById(R.id.dialog_text);
        ImageView dialogImage = view.findViewById(R.id.dialog_image);

        dialogText.setText(text);
        dialogImage.setImageResource(imgRes);

        dialog.setView(view).setCancelable(false);
        return dialog;
    }

    public static String millisToString(String timeInMillis, String pattern) {
        Date date;
        SimpleDateFormat dateFormat = new SimpleDateFormat(pattern);
        date = new Date(Long.parseLong(timeInMillis));
        String dateString = dateFormat.format(date);
        return dateString;
    }

    public static String dateToString(Date date, String format) {
        SimpleDateFormat dateFormat = new SimpleDateFormat(format);
        String dateString = dateFormat.format(date);
        return dateString;
    }

    public static void getRange() {
        FirebaseFirestore db = FirebaseFirestore.getInstance();
        DocumentReference ref = db.collection(AppConstants.utilsRef).document("range");
        ref.addSnapshotListener(new EventListener<DocumentSnapshot>() {
            @Override
            public void onEvent(@Nullable DocumentSnapshot value, @Nullable FirebaseFirestoreException error) {
                AppConstants.range = (long) value.get("metres");
            }
        });
    }
}

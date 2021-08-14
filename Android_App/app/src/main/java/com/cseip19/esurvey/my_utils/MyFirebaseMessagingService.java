package com.cseip19.esurvey.my_utils;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.TaskStackBuilder;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.cseip19.esurvey.MainActivity;
import com.cseip19.esurvey.R;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFirebaseMessagingServ";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "onMessageReceived: ");
        if (remoteMessage.getNotification() != null) {
            Map<String, String> payload = remoteMessage.getData();
            Log.d(TAG, "onMessageReceived: " + payload.toString());
            sendNotification(payload);
        }
    }


    @Override
    public void onNewToken(@NonNull String s) {
        super.onNewToken(s);
        Log.d(TAG, "onNewToken: " + s);
    }

    private void sendNotification(Map<String, String> payload) {
        Log.d(TAG, "sendNotification: ");

//        Create an Intent for the activity you want to start
        Intent resultIntent = new Intent(getApplicationContext(), MainActivity.class);
//        Create the TaskStackBuilder and add the intent, which inflates the back stack
        TaskStackBuilder stackBuilder = TaskStackBuilder.create(this);
        stackBuilder.addNextIntentWithParentStack(resultIntent);
//        Get the PendingIntent containing the entire back stack
        PendingIntent resultPendingIntent =
                stackBuilder.getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT);

//        NotificationCompat.Builder builder = (NotificationCompat.Builder) new NotificationCompat.Builder(this)
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "M_CH_ID");
        builder.setContentIntent(resultPendingIntent);

        builder.setAutoCancel(true)
                .setDefaults(Notification.DEFAULT_ALL)
                .setWhen(System.currentTimeMillis())
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(payload.get("topic"))
                .setContentText(payload.get("partner"));

//        builder.setSound();

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        notificationManager.notify(0, builder.build());
    }
}

package com.cseip19.esurvey.my_utils;

import java.util.ArrayList;

public class AppConstants {
    public static final int LOCATION_REQUEST = 1000;
    public static final int GPS_REQUEST = 1001;
    public static final int LOCATION_REQUEST_CODE = 23;
    public static final int SURVEY_START_REQUEST = 1002;

    public static final String questionWiseRatingsRef = "question_wise_ratings";
    public static final String surveyorRef = "Visiting_Officer_Data";
    public static final String collegeRef = "colleges";
    public static final String questionRef = "questions";
    public static final String surveyRef = "surveys";
    public static final String answerRef = "answers";
    public static final String imagesRef = "images";
    public static final String utilsRef = "utils";

    public static long range;

    public static final ArrayList<String> questionCategories = new ArrayList<>();
    public static final ArrayList<String> imageURLS = new ArrayList<>();

    public static final ArrayList<String> surveyType = new ArrayList<>();

    public static double latitude = 0;
    public static double longitude = 0;

}

package com.cseip19.esurvey.my_utils;

import com.google.firebase.Timestamp;
import com.google.firebase.firestore.GeoPoint;

import java.io.Serializable;
import java.util.List;

public class Survey implements Serializable {
    private String id;
    private Timestamp  assignDate;
    private String dateOfSurvey;
    private List<Double> scoreOfTeaching;
    private String collegeName, status, visitorId;
    private GeoPoint location;
    private double distance;

    public Survey() {
    }

    public Survey(String id, String dateOfSurvey, List<Double> scoreOfTeaching, String collegeName, String status, String visitorId, GeoPoint location, Timestamp assignDate) {
        this.id = id;
        this.dateOfSurvey = dateOfSurvey;
        this.scoreOfTeaching = scoreOfTeaching;
        this.collegeName = collegeName;
        this.status = status;
        this.visitorId = visitorId;
        this.location = location;
        this.assignDate = assignDate;
    }

    public String getDateOfSurvey() {
        return dateOfSurvey;
    }

    public List<Double> getScoreOfTeaching() {
        return scoreOfTeaching;
    }

    public String getCollegeName() {
        return collegeName;
    }

    public String getStatus() {
        return status;
    }

    public String getVisitorId() {
        return visitorId;
    }

    public GeoPoint getLocation() {
        return location;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Timestamp getAssignDate() {
        return assignDate;
    }
}

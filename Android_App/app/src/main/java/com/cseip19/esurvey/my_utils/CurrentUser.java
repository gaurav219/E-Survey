package com.cseip19.esurvey.my_utils;

public class CurrentUser {
    static String age;
    static String contactNumber;
    static String firstname;
    static String middlename;
    static String lastname;
    static String gmailID;

    public static void setter(String mAge, String cn, String fn, String mn, String ln, String id) {
        age = mAge;
        contactNumber = cn;
        firstname = fn;
        middlename = mn;
        lastname = ln;
        gmailID = id;
    }

    public static String getAge() {
        return age;
    }

    public static String getContactNumber() {
        return contactNumber;
    }

    public static String getFirstname() {
        return firstname;
    }

    public static String getMiddlename() {
        return middlename;
    }

    public static String getLastname() {
        return lastname;
    }

    public static String getGmailID() {
        return gmailID;
    }
}

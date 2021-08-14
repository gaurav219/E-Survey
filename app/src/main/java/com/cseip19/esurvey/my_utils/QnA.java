package com.cseip19.esurvey.my_utils;

public class QnA {
    private String question;
    private String answer;
    private String rating;

    public QnA() {
    }

    public QnA(String question) {
        this.question = question;
        this.answer = "";
        this.rating = "0";
    }

    public QnA(String question, String answer, String rating) {
        this.question = question;
        this.answer = answer;
        this.rating = rating;
    }

    public String getQuestion() {
        return question;
    }

    public String getAnswer() {
        return answer;
    }

    public String getRating() {
        return rating;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public void setRating(String rating) {
        this.rating = rating;
    }
}

const express = require("express");
const router = express.Router();
const firebase = require("firebase");
require("dotenv").config();

const key = process.env.CHATRA_KEY;

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.PROJECT_ID + ".firebaseapp.com",
  databaseURL: "https://" + process.env.PROJECT_ID + ".firebaseio.com",
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.PROJECT_ID + ".appspot.com",
  messagingSenderId: process.env.SENDER_ID,
  appId: process.env.APP_ID,
  measurementId: process.env.G_MEASUREMENT_ID,
};

// firebase initialized and Ref variables created
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
// Collection Ref
const collegesRef = db.collection("colleges");
const questionsRef = db.collection("questions");
const visitorDataRef = db.collection("Visiting_Officer_Data");
const surveysRef = db.collection("surveys");
const commentsRef = db.collection("comments");
const surveyImagesRef = db.collection("images");
const AnswerRef = db.collection("question_wise_ratings");

// survey questions - Global Variables
var questions = {};
const collegesNames = [];
const visitor_list = [];

// get the list of colleges from FireStore
collegesRef
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      //console.log(doc.data().CollegeName);
      collegesNames.push(doc.data().CollegeName);
    });
    // console.log(collegesNames);
  })
  .catch(err => {
    console.log(err, "getListOfColleges");
  });

// get the list of visitors from FireStore
visitorDataRef
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      visitor_list.push(doc.id);
    });
    // console.log(visitor_list);
  })
  .catch(err => {
    console.log(err, "getListOfVisitors");
  });

//Capital first letter of a string
const capitalize = s => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Get - visitor login Page
router.get("/visitor_signIn", (req, res) => {
  res.render("Visitor/visitor_signin.ejs", { msg: "", key });
});

router.post("/visitor_signIn", (req, res) => {
  // sign in
  if (firebase.auth().currentUser) {
    firebase
      .auth()
      .signOut()
      .then(() => {
        firebase
          .auth()
          .createUserWithEmailAndPassword(req.body.email, req.body.password)
          .then(() => {
            visitorDataRef
              .doc(req.body.email)
              .get()
              .update(new_visitor)
              .then(() => {
                //console.log('Created User');
                res.redirect("/visitor_home");
                return;
              })
              .catch(e => console.log(e, "Error updating visitor"));
          })
          .catch(e => {
            switch (e.code) {
              case "auth/email-already-in-use":
                firebase
                  .auth()
                  .signInWithEmailAndPassword(req.body.email, req.body.password)
                  .then(() => {
                    console.log("Successfully Signed In");
                    res.redirect("/visitor_home");
                    return;
                  })
                  .catch(err => {
                    switch (err.code) {
                      case "auth/wrong-password":
                        res.render("Visitor/visitor_signin", {
                          msg: "Invalid User or Credentials",
                        });
                        break;
                      default:
                        console.log(e.message);
                        break;
                    }
                  })
                  .catch(err => {
                    switch (err.code) {
                      case "auth/wrong-password":
                        res.render("Visitor/visitor_signin", {
                          msg: "Invalid User or Credentials",
                        });
                        break;
                      default:
                        console.log(e.message);
                        break;
                    }
                    console.log(err, "Cannot Sign In");
                  });
                break;
              case "auth/wrong-password":
                res.render("Visitor/visitor_signin", {
                  msg: "Invalid Credentials",
                });
                break;
              default:
                console.log(e.message);
                break;
            }
          });
      });
  } else {
    firebase
      .auth()
      .createUserWithEmailAndPassword(req.body.email, req.body.password)
      .then(() => {
        visitorDataRef
          .doc(req.body.email)
          .update({
            pass: firebase.firestore.FieldValue.delete(),
          })
          .then(() => {
            console.log("Created User");
            res.redirect("/visitor_home");
            return;
          })
          .catch(e => console.log(e, "Error Updating Visitor"));
      })
      .catch(e => {
        // console.log(e.code, "E_CODE");
        switch (e.code) {
          case "auth/email-already-in-use":
            firebase
              .auth()
              .signInWithEmailAndPassword(req.body.email, req.body.password)
              .then(() => {
                console.log("Successfully Signed In");
                res.redirect("/visitor_home");
                return;
              })
              .catch(err => {
                switch (err.code) {
                  case "auth/wrong-password":
                    res.render("Visitor/visitor_signin", {
                      msg: "Invalid User or Credentials",
                    });
                    break;
                  default:
                    console.log(e.message);
                    break;
                }
                console.log(err, "Cannot Sign In");
              });
            break;
          default:
            console.log(e.message);
            break;
        }
      });
  }
});

// visitor Logout
router.post("/visitor_logout", (req, res) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      //console.log('Signed out visitor');
      // Sign-out successful.
      res.redirect("/visitor_signin");
      return;
    })
    .catch(err => {
      //console.log('Signing out visitor error');
      console.log(err.message, "Signing out visitor error");
    });
});

// Visitor Update Profile
router.get("/updateProfile_visitor", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    visitorDataRef
      .doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          //console.log(doc.data());
          res.render("Visitor/visitor_update_profile.ejs", {
            user_data: doc.data(),
            user: user,
          });
          return;
        } else {
          res.redirect("/visitor_signIn");
          return;
        }
      })
      .catch(err => {
        console.log(err, "Not a Visitor  - Update profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/visitor_signIn");
  }
});

// visitor profile update --- POST
// update the data in the firestore
router.post("/updateProfile_visitor", (req, res) => {
  var updated_user_data = req.body;
  var user = firebase.auth().currentUser;

  visitorDataRef
    .doc(user.email)
    .update({
      middlename: updated_user_data.middlename.toString(),
      age: updated_user_data.age.toString(),
      contactNumber: updated_user_data.contactNumber.toString(),
    })
    .then(function () {
      //console.log("Document successfully written!");
      res.redirect("/visitor_Profile");
      return;
    })
    .catch(function (error) {
      console.error("Error writing document: ", error);
      res.send(err);
    });
});

// Visitor Home Page
router.get("/visitor_home", (req, res) => {
  const user = firebase.auth().currentUser;

  if (user) {
    visitorDataRef
      .doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          // console.log("DOC EXists");
          res.render("Visitor/visitor_home.ejs", {
            useremail: user.email,
            key,
          });
          return;
        } else {
          console.log("Not a Visitor - Visitor Home");
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log(err.message, "Not a Visitor - Visitor Home Catch");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/visitor_signIn");
    return;
  }
});

//Visitor Profile Page
router.get("/visitor_Profile", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    visitorDataRef
      .doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          //console.log(doc.data());
          // console.log(user);
          res.render("Visitor/visitor_profile.ejs", {
            user_data: doc.data(),
            user: user,
            key,
          });
          return;
        } else {
          res.redirect("/visitor_signIn");
          return;
        }
      })
      .catch(err => {
        console.log(err.message, "Not a Visitor - Visitor Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/visitor_signIn");
    return;
  }
});

//Visitor past suveys page
router.get("/past_surveys", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    var pending_surveys = [],
      completed_surveys = [];
    questionsRef
      .get()
      .then(Response => {
        Response.forEach(doc => {
          //console.log(doc.id);
          questions[doc.id] = doc.data();
        });
        surveysRef
          .get()
          .then(response => {
            response.forEach(doc => {
              // console.log(doc.id);
              // console.log(doc.data());
              var temp = {};

              if (doc.data().visitorId == user.email) {
                if (doc.data().status == "completed") {
                  // add the data to the List
                  temp = doc.data();
                  temp["Sid"] = doc.id;
                  completed_surveys.push(temp);
                } else {
                  // survey is completed
                  // add the data to the List
                  // x 1000for chorome TimeStamp to Date
                  var date = new Date(doc.data().assignDate.seconds * 1000);
                  temp = doc.data();
                  temp["assignDateOfSurvey"] = date;
                  temp["Sid"] = doc.id;
                  pending_surveys.push(temp);
                }
              }
            });
            // console.log(user_surveys);
            //console.log(questions);
            //console.log(Object.keys(questions));
            //console.log(user_surveys);
            res.render("Visitor/visitor_past_surveys.ejs", {
              completed_surveys: completed_surveys,
              pending_surveys: pending_surveys,
              useremail: user.email,
              questions: questions,
              key,
            });
            return;
          })
          .catch(err => {
            console.log(err.message, " No Survey Pressent - Past Surveys");
            res.redirect("/visitor_home");
            return;
          });
      })
      .catch(err => {
        console.log(err.message, " No Question Fetched - Past Surveys");
        res.redirect("/visitor_home");
        return;
      });
  } else {
    res.redirect("/visitor_signIn");
  }
});

// Show Survey Details
router.get("/survey_detail", (req, res) => {
  var user = firebase.auth().currentUser;
  // if the user exsists
  if (user) {
    // if the Survey ID in query is empty ""
    if (req.query.id.length == 0) {
      res.redirect("/visitor_home");
      return;
    } else {
      visitorDataRef
        .doc(user.email)
        .get()
        .then(doc => {
          if (doc.exists) {
            surveysRef
              .doc(req.query.id)
              .get()
              .then(doc => {
                if (!doc.exists) {
                  res.redirect("/");
                  return;
                } else {
                  // res.send(doc.data());
                  var survey_Data = doc.data();
                  if (survey_Data.status === "open") {
                    res.redirect("/past_surveys");
                    return;
                  } else {
                    survey_Data["surveyID"] = req.query.id;

                    AnswerRef.doc(req.query.id)
                      .get()
                      .then(response => {
                        let Question_wise_ratings = response.data();
                        let ratings = {};
                        let sections = Object.keys(Question_wise_ratings);
                        for (let i = 0; i < sections.length; i++) {
                          ratings[sections[i]] =
                            Question_wise_ratings[sections[i]];
                        }

                        // comments
                        commentsRef
                          .doc(req.query.id)
                          .get()
                          .then(commentsRes => {
                            let comments = [];
                            if (commentsRes.exists) {
                              comments = commentsRes.data();
                            }
                            // get images if present
                            surveyImagesRef
                              .doc(req.query.id)
                              .get()
                              .then(img_res => {
                                if (img_res.exists) {
                                  console.log("Document data:", img_res.data());
                                  // get images
                                  db.collection(
                                    "/images/" + req.query.id + "/images"
                                  )
                                    .get()
                                    .then(querySnapshot => {
                                      let imgList = [];
                                      querySnapshot.forEach(doc => {
                                        imgList.push(doc.data().url);
                                      });

                                      res.render("Visitor/survey.ejs", {
                                        surveyData: survey_Data,
                                        questions: questions,
                                        ratings: ratings,
                                        imgData: imgList,
                                        comments,
                                        sections,
                                      });
                                      return;
                                    })
                                    .catch(err => {
                                      console.log(err);
                                      res.redirect("/visitor_home");
                                      return;
                                    });
                                } else {
                                  console.log("No images found.!");
                                  res.render("Visitor/survey.ejs", {
                                    surveyData: survey_Data,
                                    questions: questions,
                                    ratings: ratings,
                                    imgData: [],
                                    comments,
                                    sections,
                                  });
                                  return;
                                }
                              })
                              .catch(err => {
                                console.log(
                                  err,
                                  "Invalid survey ID for images"
                                );
                                res.redirect("/visitor_home");
                                return;
                              });
                          })
                          .catch(err => {
                            console.log(err, "Invalid survey ID for images");
                            res.redirect("/visitor_home");
                            return;
                          });
                      })
                      .catch(err => {
                        console.log(
                          err,
                          "Invalid Answers - Visitor Survey Data"
                        );
                        res.redirect("/visitor_home");
                        return;
                      });
                  }
                }
              })
              .catch(err => {
                console.log(err, "Invalid Survey - Visitor Survey Data");
                res.redirect("/visitor_home");
                return;
              });
          }
        })
        .catch(err => {
          console.log(err, "INvalid Vistior - Survey Data");
          res.redirect("/visitor_signIn");
          return;
        });
    }
  } else {
    res.redirect("/");
  }
});

// ------------ College List route ----------------------
router.get("/colleges", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    visitorDataRef
      .doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          // res.send(req.query.id)
          collegesRef
            .get()
            .then(response => {
              var collegeData = [];
              response.forEach(doc => {
                var data = doc.data();
                data["c_id"] = doc.id;
                collegeData.push(data);
                data["type"] = capitalize(data["type"]);
              });
              //console.log(collegeData);
              res.render("Visitor/collegelist.ejs", { collegeData, key });
              return;
            })
            .catch(err => {
              console.log(err, "INvalid College Data - Colleges Data Visitor");
              res.redirect("/");
              return;
            });
        } else {
          res.redirect("/visitor_signIn");
          return;
        }
      })
      .catch(err => {
        console.log(err, "INvalid Visitor - Colleges Data Visitor");
        res.redirect("/visitor_signIn");
      });
  } else {
    res.redirect("/visitor_signIn");
  }
});

// college profile
router.get("/college_detail", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && req.query.id !== "") {
    visitorDataRef
      .doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          // send the college data
          collegesRef
            .doc(req.query.id)
            .get()
            .then(data => {
              if (!data.exists) {
                res.redirect("/visitor_home");
                return;
              } else {
                var collegeData = data.data();
                var collegeName = data.data().CollegeName;

                collegeData.type = capitalize(collegeData.type);
                // extract all the completed sureys
                var surveyData = [];
                surveysRef
                  .get()
                  .then(snapshot => {
                    snapshot.forEach(temp_survey => {
                      // extract all the completed sureys
                      console.log(temp_survey.data().collegeName);
                      if (
                        temp_survey.data().status == "completed" &&
                        temp_survey.data().collegeName == collegeName
                      ) {
                        surveyData.push(temp_survey.data());
                      }
                    });
                    //console.log(surveyData);
                    res.render("Visitor/collegeDetails.ejs", {
                      collegeData,
                      surveyData,
                      key,
                    });
                    return;
                  })
                  .catch(err => {
                    console.log(
                      err,
                      "INvalid Survey - Colleges Profile Visitor"
                    );
                    res.redirect("/visitor_home");
                    return;
                  });
              }
            })
            .catch(err => {
              console.log(err, "INvalid Colleges - Colleges Profile Visitor");
              res.redirect("/visitor_home");
              return;
            });
        } else {
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log(err, "INvalid Visitor - Colleges Profile Visitor");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/visitor_home");
    return;
  }
});

module.exports = router;

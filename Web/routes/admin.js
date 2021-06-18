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
const adminRef = db.collection("Admin");
const surveysRef = db.collection("surveys");
const commentsRef = db.collection("comments");
const surveyImagesRef = db.collection("images");
const AnswerRef = db.collection("question_wise_ratings");
const QueriesRef = db.collection("queries");
// survey questions - Global Variables
var questions = {};
const collegesNames = [];
const visitor_list = [];

// requiring pdfMake modules
const pdfMake = require("../pdfmake/pdfmake");
const vfsFonts = require("../pdfmake/vfs_fonts");
// setting font info
pdfMake.vfs = vfsFonts.pdfMake.vfs;

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

// @route       GET /admin_login
// @description Admin_login route
// @access      Public
router.get("/admin_login", (req, res) => {
  res.render("Admin/admin_login.ejs", { key });
});

// REGISTERING THE USER IS DONE BY ADMIN

// // Get - visitor signup Page
router.get("/visitor_signUp", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            res.render("Admin/visitor_signup.ejs");
            return;
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Visitor SignUp Admin UnAuth ");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
  }
});

router.post("/visitor_signUp", (req, res) => {
  const new_Visitor_Data = {
    V_id: req.body.email,
    age: "",
    contactNumber: "",
    firstname: req.body.firstname,
    gmailID: req.body.email,
    lastname: req.body.lastname,
    middlename: req.body.middlename,
  };

  new_Visitor_Data["pass"] = req.body.password;

  visitorDataRef
    .doc(req.body.email)
    .set(new_Visitor_Data)
    .then(err => {
      if (err) {
        console.log(err, "VISITOR ERROR");
        res.redirect("/visitor_signUp");
        return;
      } else {
        console.log("successfully created visitor");
        res.redirect("/visiting_Officer_list");
        return;
      }
    })
    .catch(e => {
      console.log(e, "Error setting a Visitor");
      return;
    });
});

// post - admin login INCOMPLETE
router.post("/admin_login", (req, res) => {
  if (firebase.auth.currentUser) {
    firebase
      .auth()
      .signOut()
      .then(() => {
        firebase
          .auth()
          .signInWithEmailAndPassword(
            req.body.admin_username,
            req.body.admin_password
          )
          .then(() => {
            var user = firebase.auth().currentUser;
            adminRef
              .get()
              .then(snapshot => {
                snapshot.forEach(doc => {
                  var temp_username = doc.id;
                  if (temp_username === user.email) {
                    res.redirect("/admin_home");
                    return;
                  }
                });
              })
              .catch(err => {
                console.log(err.message, "Not an Admin - Admin Login");
                res.redirect("/admin_login");
                return;
              });
          })
          .catch(err => {
            console.log(err.message, "Invalid Credentials - Admin Login");
            res.render("Admin/admin_login.ejs", {
              msg: err.message.toString(),
            });
            return;
          });
      })
      .catch(err => {
        console.log(err.message, "InComplete SignOut - admin login");
        return;
      });
  } else {
    firebase
      .auth()
      .signInWithEmailAndPassword(
        req.body.admin_username,
        req.body.admin_password
      )
      .then(() => {
        var user = firebase.auth().currentUser;
        adminRef
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              var temp_username = doc.id;
              if (temp_username === user.email) {
                res.redirect("/admin_home");
                return;
              }
            });
          })
          .catch(err => {
            console.log(err.message, "Not an Admin - Admin Login");
            res.redirect("/admin_login");
            return;
          });
      })
      .catch(err => {
        console.log(err.message, "Invalid Credentials - Admins Login");
        res.render("Admin/admin_login.ejs", { msg: err.message.toString() });
        return;
      });
  }
});

// admin logout
router.get("/admin_logout", (req, res) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      // Sign-out successful.
      res.redirect("/admin_login");
      return;
    })
    .catch(err => {
      console.log(err.message, "Incomplete Logout");
      res.redirect("/");
    });
});

router.get("/admin_home", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            res.render("Admin/admin_home.ejs", {
              user,
              key,
            });
            return;
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - Home");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
  }
});

// list of all the Visiting Officers
router.get("/visiting_Officer_list", (req, res) => {
  console.log("INSIDE VISITING");
  var user = firebase.auth().currentUser;
  if (user) {
    console.log("user");
    console.log(user.email, "USER EMAIL");

    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            console.log("USER IS ADMIN");
            var Visiting_Officer_Data = [];
            visitorDataRef
              .get()
              .then(result => {
                result.forEach(tempdata => {
                  Visiting_Officer_Data.push(tempdata.data());
                });

                console.log(Visiting_Officer_Data);
                res.render("Admin/visitorList.ejs", {
                  data: Visiting_Officer_Data,
                });
                return;
              })
              .catch(err => {
                console.log(
                  err.message,
                  "Invalid Admin -  List of Visiting Officers"
                );
                return;
              });
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - List of Visiting Officers");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

//Remove Visiting Officers
router.get("/remove_officers", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        var Visiting_Officer_Data = [];
        visitorDataRef
          .get()
          .then(result => {
            result.forEach(tempdata => {
              Visiting_Officer_Data.push(tempdata.data());
            });
            snapshot.forEach(doc => {
              var temp_username = doc.id;
              if (temp_username === user.email) {
                console.log(Visiting_Officer_Data);
                res.render("Admin/visitorRemoveList.ejs", {
                  data: Visiting_Officer_Data,
                });
                return;
              }
            });
          })
          .catch(err => {
            console.log(
              err.message,
              "Invalid Visitor - Remove Visiting Officers"
            );
            return;
          });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin -  Remove Visiting Officers");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
  }
});

//Remove Officer
router.get("/removeOfficer/:id", (req, res) => {
  const email = req.params.id;
  visitorDataRef
    .doc(email)
    .delete()
    .then(() => {
      console.log("Removed Successfully");
      res.redirect("/remove_officers");
      return;
    })
    .catch(e => {
      console.log(e.message, "Invalid Visitor - Remove Visiting Officers");
      res.redirect("/remove_officers");
    });
});

// Assign New Survey
router.get("/assign_new_survey", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            console.log(collegesNames);
            res.render("Admin/new_survey.ejs", {
              collegesNames: collegesNames,
              visitor_list: visitor_list,
            });
            return;
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - New Survey");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
  }
});

// Assign new Survey --- POST
router.post("/assign_new_survey", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            var assignDate = firebase.firestore.Timestamp.fromDate(
              new Date(req.body.dataOfSurvey)
            );
            var collegeLocation = [];
            collegesRef
              .get()
              .then(response => {
                response.forEach(doc => {
                  if (
                    doc.data().CollegeName.toLowerCase() ===
                    req.body.college.toLowerCase()
                  ) {
                    collegeLocation = doc.data().coordinates;
                  }
                });
                surveysRef
                  .add({
                    assignDate: assignDate,
                    collegeName: req.body.college,
                    dateOfSurvey: "",
                    location: collegeLocation,
                    scoreOfTeaching: [],
                    type: [req.body.type],
                    status: "open",
                    visitorId: req.body.visitorID,
                  })
                  .then(function (docRef) {
                    console.log("Document written with ID: ", docRef.id);
                    surveysRef
                      .doc(docRef.id)
                      .update({
                        id: docRef.id.toString(),
                      })
                      .then(function () {
                        res.redirect("/show_Surveys");
                        return;
                      })
                      .catch(function (error) {
                        console.error("Error updating document: ", error);
                        res.redirect("/assign_new_survey");
                        return;
                      });
                  })
                  .catch(function (error) {
                    console.error("Error adding document: ", error);
                    res.redirect("/assign_new_survey");
                    return;
                  });
              })
              .catch(err => {
                console.log(
                  err.message,
                  "College Data not Fetched - New Survey POST"
                );
                res.redirect("/admin_home");
                return;
              });
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - New Survey - POST");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

// visitor Profile Details
router.get("/visitor_data", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            // res.send(req.query.id)
            visitorDataRef
              .doc(req.query.id)
              .get()
              .then(doc => {
                if (doc.exists) {
                  res.render("Admin/visitorProfile.ejs", {
                    user_data: doc.data(),
                  });
                  return;
                } else {
                  res.redirect("/visitorList");
                  return;
                }
              })
              .catch(err => {
                console.log(err.message, "Invalid Visitor - Visitor Data");
                res.redirect("/");
                return;
              });
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - Visitor Data");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

// Show all SurveysData
router.get("/show_Surveys", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        var All_Surveys = [];
        surveysRef
          .get()
          .then(result => {
            result.forEach(tempdata => {
              var tempData = tempdata.data();
              tempData["id"] = tempdata.id;
              All_Surveys.push(tempData);
            });
            snapshot.forEach(doc => {
              var temp_username = doc.id;
              if (temp_username === user.email) {
                // console.log(All_Surveys);
                var Pending_Surveys = [],
                  Completed_Surveys = [];
                All_Surveys.forEach(survey => {
                  if (survey.status == "open") {
                    var date = new Date(survey.assignDate.seconds * 1000);
                    survey["assignDateOfSurvey"] = date;
                    survey["status"] = capitalize(survey["status"]);
                    Pending_Surveys.push(survey);
                  } else {
                    survey["status"] = capitalize(survey["status"]);
                    Completed_Surveys.push(survey);
                  }
                });
                console.log(Pending_Surveys);
                //console.log(Completed_Surveys);

                Pending_Surveys = Pending_Surveys.sort((a, b) => {
                  return (
                    new Date(a.assignDate.seconds * 1000) -
                    new Date(b.assignDate.seconds * 1000)
                  );
                });

                Completed_Surveys = Completed_Surveys.sort((a, b) => {
                  return (
                    new Date(b.assignDate.seconds * 1000) -
                    new Date(a.assignDate.seconds * 1000)
                  );
                });

                res.render("Admin/showAllSureys.ejs", {
                  pending_surveys: Pending_Surveys,
                  completed_surveys: Completed_Surveys,
                });
                return;
              }
            });
          })
          .catch(err => {
            console.log(err.message, "Invalid Survey - All Surveys Data");
            res.redirect("/admin_home");
            return;
          });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - All Surveys Data");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
  }
});

// Show Queries made Anonymously
router.get("/show_Queries", (req, res) => {
  //   console.log("INSIDE Quer");
  var user = firebase.auth().currentUser;
  if (user) {
    console.log("user");
    console.log(user.email, "USER EMAIL");

    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            console.log("USER IS ADMIN");
            var Queries = [];
            QueriesRef.get()
              .then(result => {
                result.forEach(tempdata => {
                  const query = tempdata.data();
                  query["id"] = tempdata.id;
                  //   console.log(tempdata.data(), "tempddata");
                  Queries.push(query);
                });
                let rejected = Queries.filter(
                  query => query.status === "Rejected"
                );
                let approved = Queries.filter(
                  query => query.status === "Approved"
                );
                let pending = Queries.filter(
                  query => query.status === "Pending"
                );

                Queries = Queries.filter(query => query.status !== "Rejected");
                //console.log(Queries);
                res.render("Admin/show_Queries.ejs", {
                  data: Queries,
                  rejected,
                  pending,
                  approved,
                });
                return;
              })
              .catch(err => {
                console.log(err.message, "Invalid Admin -  List of Queries");
                return;
              });
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - List of Queries");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

//show a survey VIA id to ADMIN ONLY
router.get("/survey_data", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            // if the Survey ID in query is empty ""
            if (req.query.id.length == 0) {
              res.redirect("/admin_home");
              return;
            } else {
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
                    survey_Data["surveyID"] = req.query.id;
                    if (survey_Data.status === "open") {
                      //res.send(doc.data());
                      var date = new Date(
                        survey_Data.assignDate.seconds * 1000
                      );
                      survey_Data["assignDateOfSurvey"] = date;
                      survey_Data["status"] = capitalize(survey_Data["status"]);
                      res.render("Admin/admin_surveyData.ejs", {
                        surveyData: survey_Data,
                        key,
                      });
                      return;
                    } else {
                      // console.log(survey_Data);
                      // console.log(questions);
                      //res.send(survey_Data)
                      questionsRef
                        .get()
                        .then(Response => {
                          Response.forEach(doc => {
                            //console.log(doc.id);
                            questions[doc.id] = doc.data();
                          });
                          // var date = new Date(survey_Data.dateOfSurvey.seconds * 1000);
                          // survey_Data['DateOfSurvey'] = date;
                          survey_Data["surveyID"] = req.query.id;
                          survey_Data["status"] = capitalize(
                            survey_Data["status"]
                          );
                          //console.log(survey_Data);
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

                              // console.log(ratings);

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
                                        console.log(
                                          "Document data:",
                                          img_res.data()
                                        );
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
                                            //console.log(imgList.length);
                                            res.render(
                                              "Admin/admin_surveyData.ejs",
                                              {
                                                surveyData: survey_Data,
                                                questions: questions,
                                                ratings: ratings,
                                                imgData: imgList,
                                                comments,
                                                sections,
                                              }
                                            );
                                            return;
                                          })
                                          .catch(err => {
                                            console.log(err);
                                            res.redirect("/admin_home");
                                            return;
                                          });
                                      } else {
                                        console.log("No images found.!");
                                        res.render(
                                          "Admin/admin_surveyData.ejs",
                                          {
                                            surveyData: survey_Data,
                                            questions: questions,
                                            ratings: ratings,
                                            imgData: [],
                                            comments,
                                            sections,
                                          }
                                        );
                                        return;
                                      }
                                    })
                                    .catch(err => {
                                      console.log(
                                        err,
                                        "Invalid survey ID for images"
                                      );
                                      res.redirect("/admin_home");
                                      return;
                                    });
                                })
                                .catch(err => {
                                  console.log(
                                    err,
                                    "Invalid survey ID for images"
                                  );
                                  res.redirect("/admin_home");
                                  return;
                                });
                            })
                            .catch(err => {
                              console.log(
                                err,
                                "Invalid Answers - Single Survey Data"
                              );
                              res.redirect("/admin_home");
                              return;
                            });
                        })
                        .catch(err => {
                          console.log(
                            err,
                            "Invalid Questions - Single Survey Data"
                          );
                          res.redirect("/admin_home");
                          return;
                        });
                    }
                  }
                })
                .catch(err => {
                  console.log(err, "Invalid Survey Data - Single Survey Data");
                  res.redirect("/admin_home");
                });
            }
          }
        });
      })
      .catch(err => {
        console.log(err, "Invalid Admin - Single Survey Data");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

// add a college -- Admin Only
router.get("/add_college", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            res.render("Admin/admin_add_college.ejs");
            return;
          }
        });
      })
      .catch(err => {
        console.log(err, "Invalid Answers - Add College Data");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/");
    return;
  }
});

// add college to the database  --- POST
router.post("/add_college", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            var lat = parseFloat(req.body.latitude);
            var long = parseFloat(req.body.longitude);
            collegesRef
              .add({
                Affiliations: "",
                C_id: req.body.collegeID,
                CollegeName: req.body.college_fullname,
                address: req.body.address,
                coordinates: new firebase.firestore.GeoPoint(lat, long),
                type: req.body.Type,
                website: "",
                views: [],
              })
              .then(function (docRef) {
                console.log("College Add with ID: ", docRef.id);
                collegesNames.push(req.body.college_fullname);
                res.redirect("/admin_home");
                return;
              })
              .catch(function (error) {
                console.error("Error adding college: ", error);
                res.redirect("/add_college");
                return;
              });
          }
        });
      })
      .catch(err => {
        console.log(err, "Invalid Answers - Add College Data - POST");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/");
  }
});

// email verification all users
router.get("/getEmailVerified", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    if (user.emailVerified) {
      res.redirect("/visitor_home");
      return;
    } else {
      user
        .sendEmailVerification()
        .then(() => {
          res.redirect("/visitor_home");
          return;
        })
        .catch(err => {
          console.log(err, "Invalid Email verification-Visitor");
          res.redirect("/");
        });
    }
  } else {
    res.redirect("/");
  }
});

//generate Survey Pdf -- only for ADMIN
router.post("/generate_PDF", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            // if the Survey ID in query is empty ""
            if (req.query.id.length == 0) {
              res.redirect("/admin_home");
              return;
            } else {
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
                    survey_Data["surveyID"] = req.query.id;
                    if (survey_Data.status === "open") {
                      //res.send(doc.data());
                      res.redirect("/admin_home");
                      return;
                    } else {
                      // console.log(survey_Data);
                      // console.log(questions);
                      //res.send(survey_Data)
                      questionsRef
                        .get()
                        .then(Response => {
                          Response.forEach(doc => {
                            questions[doc.id] = doc.data();
                          });
                          survey_Data["surveyID"] = req.query.id;
                          survey_Data["status"] = capitalize(
                            survey_Data["status"]
                          );
                          //console.log(survey_Data);
                          AnswerRef.doc(req.query.id)
                            .get()
                            .then(response => {
                              let survey_res = response.data();
                              let sections = Object.keys(survey_res);

                              let survey_data = {};
                              for (let i = 0; i < sections.length; i++) {
                                let score = [],
                                  questions = [],
                                  total = 0;
                                for (
                                  let j = 0;
                                  j < survey_res[sections[i]].length;
                                  j++
                                ) {
                                  let temp =
                                    survey_res[sections[i]][j].split("_");
                                  questions.push(temp[0]);
                                  let t_score = parseFloat(temp[1]);
                                  total += t_score;
                                  score.push(temp[1]);
                                }

                                survey_data[sections[i]] = {
                                  Questions: questions,
                                  Ratings: score,
                                  Total_Score: total,
                                };
                              }

                              const current_date =
                                new Date().toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
                                });

                              const curr_Date = new Date().toLocaleString(
                                "en-US",
                                {
                                  hour: "numeric",
                                  minute: "numeric",
                                  hour12: true,
                                }
                              );
                              let content_data = [
                                { text: "E-Survey Report", style: "header" },
                                `This is an Official documentation generated by E-survey and Dashboard **(for Admin Only).\n\n Date and Time of Report Generation: ${current_date} ${curr_Date} \n\n`,

                                {
                                  text: "Survey Details",
                                  style: "subheader",
                                },
                                "\nSurvey ID : " +
                                  survey_Data.surveyID.toString(),
                                "\nVisitor ID : " +
                                  survey_Data.visitorId.toString(),
                                "\nCollege Name : " +
                                  survey_Data.collegeName.toString(),
                                "\nStatus : Completed",
                                "\nDate of Survey : " +
                                  survey_Data.dateOfSurvey.toString(),

                                { text: "Ratings/Score", style: "subheader" },
                              ];

                              for (let i = 0; i < sections.length; i++) {
                                tempBody = [];

                                for (
                                  let j = 0;
                                  j < survey_data[sections[i]].Questions.length;
                                  j++
                                ) {
                                  tempBody.push([
                                    survey_data[sections[i]].Questions[j],
                                    survey_data[sections[i]].Ratings[j],
                                  ]);
                                }

                                content_data.push({
                                  text: sections[i],
                                  style: "section_title",
                                });
                                content_data.push({
                                  text:
                                    "Total Score : " +
                                    survey_data[sections[i]].Total_Score +
                                    "/" +
                                    survey_data[sections[i]].Questions.length *
                                      5,
                                });
                                content_data.push({
                                  text: "\nQuestions-Marks Breakdown :",
                                });
                                content_data.push({
                                  style: "tableExample",
                                  table: {
                                    widths: ["*", "auto"],
                                    body: tempBody,
                                  },
                                });
                              }

                              let docDefinition = {
                                watermark: {
                                  text: "E-Survey and Dashboard\n\n",
                                  color: "blue",
                                  opacity: 0.15,
                                  bold: true,
                                  italics: false,
                                },

                                content: content_data,
                                styles: {
                                  header: {
                                    fontSize: 30,
                                    bold: true,
                                    alignment: "center",
                                    decoration: "underline",
                                    decorationColor: "black",
                                    margin: [0, 0, 0, 50],
                                  },
                                  subheader: {
                                    fontSize: 20,
                                    bold: true,
                                    margin: [0, 20, 0, 10],
                                  },
                                  section_title: {
                                    fontSize: 15,
                                    bold: true,
                                    margin: [0, 10, 0, 5],
                                  },
                                  tableExample: {
                                    margin: [0, 5, 0, 15],
                                  },
                                },
                              };

                              const curr_date = new Date();

                              const pdfDoc = pdfMake.createPdf(docDefinition);
                              pdfDoc.getBase64(data => {
                                res.writeHead(200, {
                                  "Content-Type": "application/pdf",
                                  "Content-Disposition": `attachment; filename=${
                                    curr_date.getFullYear() +
                                    "-" +
                                    (JSON.parse(curr_date.getMonth()) + 1) +
                                    "-" +
                                    curr_date.getDate() +
                                    "_" +
                                    survey_Data.surveyID +
                                    ".pdf"
                                  }`,
                                });

                                const download = Buffer.from(
                                  data.toString("utf-8"),
                                  "base64"
                                );

                                res.end(download);
                              });
                              return;
                            })
                            .catch(err => {
                              console.log(
                                err,
                                "Invalid Answers - Single Survey Data"
                              );
                              res.redirect("/admin_home");
                              return;
                            });
                        })
                        .catch(err => {
                          console.log(
                            err,
                            "Invalid Questions - Single Survey Data"
                          );
                          res.redirect("/admin_home");
                          return;
                        });
                    }
                  }
                })
                .catch(err => {
                  console.log(err, "Invalid Survey Data - Single Survey Data");
                  res.redirect("/admin_home");
                });
            }
          }
        });
      })
      .catch(err => {
        console.log(err, "Invalid Admin - Single Survey Data");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

// show query deatials by ID
router.get("/query", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            if (req.query.id.length == 0) {
              res.redirect("/admin_home");
              return;
            } else {
              QueriesRef.doc(req.query.id)
                .get()
                .then(result => {
                  let data = result.data();
                  data["id"] = req.query.id;
                  console.log(data);
                  res.render("Admin/admin_query.ejs", {
                    data,
                    key,
                  });
                  return;
                })
                .catch(err => {
                  console.log(err.message, "Invalid Admin -  Query ID ");
                  res.redirect("/admin_home");
                  return;
                });
            }
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - List of Queries");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

router.get("/request_response/:id", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    adminRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          var temp_username = doc.id;
          if (temp_username === user.email) {
            if (req.params.id.length == 0) {
              res.redirect("/admin_home");
              return;
            } else {
              const response = req.query.q;
              const id = req.params.id;
              if (response === "approved") {
                QueriesRef.doc(id)
                  .update({
                    status: "Approved",
                  })
                  .then(() => {
                    console.log("Query Approved");
                    res.redirect("/admin_home");
                  });
              } else if (response === "rejected") {
                QueriesRef.doc(id)
                  .update({
                    status: "Rejected",
                  })
                  .then(() => {
                    console.log("Query Rejected");
                    res.redirect("/admin_home");
                  });
              }
            }
          }
        });
      })
      .catch(err => {
        console.log(err.message, "Invalid Admin - Respond Query");
        res.redirect("/admin_login");
        return;
      });
  } else {
    res.redirect("/admin_login");
    return;
  }
});

module.exports = router;

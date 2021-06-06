const express = require("express");
const router = express.Router();
const firebase = require("firebase");
require("dotenv").config();

const key = process.env.CHATRA_KEY;

// require encrypt and decrypt methods
const { encrypt, decrypt } = require("../Resouces/crypto");
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
const surveysRef = db.collection("surveys");
const Guests = db.collection("Guests");
const QueriesRef = db.collection("queries");
const UserSearchHistoryRef = db.collection("User_Search_History");

// survey questions - Global Variables
const collegesNames = [];

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

// // get the list of visitors from FireStore
// visitorDataRef
// 	.get()
// 	.then((snapshot) => {
// 		snapshot.forEach((doc) => {
// 			visitor_list.push(doc.id);
// 		});
// 		// console.log(visitor_list);
// 	})
// 	.catch((err) => {
// 		console.log(err, 'getListOfVisitors');
// 	});

//Capital first letter of a string
const capitalize = s => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Get - Student login Page
router.get("/guest_signIn", (req, res) => {
  res.render("Guest/guest_signin.ejs", { key });
});

// Post - Gues sign Page (login the guest)
router.post("/guest_signIn", (req, res) => {
  // sign in
  // console.log(req.body);
  if (firebase.auth().currentUser) {
    firebase
      .auth()
      .signOut()
      .then(() => {
        firebase
          .auth()
          .signInWithEmailAndPassword(req.body.email, req.body.password)
          .then(() => {
            res.redirect("/guest_home");
            return;
          });
      });
  } else {
    firebase
      .auth()
      .signInWithEmailAndPassword(req.body.email, req.body.password)
      .then(() => {
        res.redirect("/guest_home");
        return;
      })
      .catch(err => {
        console.log(err.message, "Guest UnAuth");
        res.render("Guest/guest_signin.ejs", {
          key,
          alert_msg: err.message,
        });
        return;
      });
  }
});

//After successful autentication of User
router.get("/guest_home", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    //console.log(user);
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          collegesRef
            .get()
            .then(snapshot => {
              let colleges = [];
              snapshot.forEach(college_data => {
                let temp = college_data.data();
                temp.type = capitalize(temp.type);
                temp["id"] = college_data.id;
                colleges.push(temp);
              });

              // college selecting value
              const n = 5;
              // filter top-visited colleges 3-5
              colleges.sort((a, b) => {
                return b.views.length - a.views.length;
              });

              let mostVisited = colleges.slice(0, n);

              // console.log(mostVisited);
              res.render("Guest/guest_home.ejs", {
                data: mostVisited,
                useremail: user.email,
                key,
              });
              return;
            })
            .catch(err => {
              console.log(err.message, "No College Data Fetched - Guest Home");
              res.redirect("/guest_signIn");
              return;
            });
        } else {
          console.log("USERESD");
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log("BCIUUBWUW", err.message);
        res.redirect("/");
        return;
      });
  } else {
    console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

router.get("/guest_profile", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          res.render("Guest/guest_profile.ejs", {
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
        console.log(err, "Not a Guest - Guest Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/visitor_signIn");
  }
});

// Visitor Update Profile
router.get("/updateProfile_guest", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          //console.log(doc.data());
          res.render("Guest/guest_update_profile.ejs", {
            user_data: doc.data(),
            user: user,
          });
          return;
        } else {
          res.redirect("/guest_signIn");
          return;
        }
      })
      .catch(err => {
        console.log(err, "Not a Guest - Guest Update Profile (GET)");
        res.redirect("/guest_signIn");
        return;
      });
  } else {
    res.redirect("/guest_signIn");
  }
});

// visitor profile update --- POST
// update the data in the firestore
router.post("/updateProfile_guest", (req, res) => {
  var updated_user_data = req.body;
  var user = firebase.auth().currentUser;

  Guests.doc(user.email)
    .update({
      // middlename: updated_user_data.middlename.toString(),
      // age: updated_user_data.age.toString(),
      number: updated_user_data.contactNumber.toString(),
    })
    .then(function () {
      //console.log("Document successfully written!");
      res.redirect("/guest_profile");
      return;
    })
    .catch(function (error) {
      console.error("Error writing document: ", error);
      res.send(err);
      res.redirect("/guest_home");
      return;
    });
});

// Get - Guest signup Page
router.get("/guest_signUp", (req, res) => {
  res.render("Guest/guest_signup.ejs", { key });
});

// Get - Submit Anonymous request to Admin
router.get("/submit_request", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    //console.log(user);
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          res.render("Guest/submit_request", {
            key,
            msg: "",
          });
          return;
        } else {
          console.log("USERESD");
          res.redirect("/guest_home");
          return;
        }
      })
      .catch(err => {
        console.log("BCIUUBWUW", err.message);
        res.redirect("/");
        return;
      });
  } else {
    //console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

router.post("/submit_request", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    //console.log(user);
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          // hashing the user email
          const hash = encrypt(user.email);

          //console.log(hash);

          const query = {
            subject: req.body.subject,
            body: req.body.body1,
            label: req.body.label,
            date: Date.now(),
            status: "Pending",
            user: hash,
          };

          // res.render("Guest/submit_request", {
          //   msg: "Query has been submitted Successfully",
          // });

          QueriesRef.doc()
            .set(query)
            .then(() => {
              //console.log("query created");
              res.render("Guest/submit_request", {
                msg: "Query has been submitted Successfully",
              });
            })
            .catch(e => {
              console.log("Error!! can't create query", e);
              res.redirect("/guest_home");
            });
        } else {
          console.log("USERESD");
          res.redirect("/guest_home");
          return;
        }
      })
      .catch(err => {
        console.log("BCIUUBWUW", err.message);
        res.redirect("/");
        return;
      });
  } else {
    //console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

// Post - Guest signup Page (Register the Guest)
router.post("/guest_signUp", (req, res) => {
  var guest = {
    V_id: req.body.email,
    age: "",
    contactNumber: "",
    firstname: req.body.firstname,
    gmailID: req.body.email,
    isMailID_verified: false,
    isVerified: false,
    lastname: req.body.lastname,
    middlename: req.body.middlename,
    number: req.body.number,
  };

  firebase
    .auth()
    .createUserWithEmailAndPassword(req.body.email, req.body.password)
    .then(() => {
      Guests.doc(req.body.email)
        .set({
          FName: req.body.firstname,
          LName: req.body.lastname,
          Email: req.body.email,
          number: req.body.number,
        })
        .then(() => {
          UserSearchHistoryRef.doc(req.body.email)
            .set({
              History: [],
              date: Date.now(),
            })
            .then(() => {
              console.log("Guest Created", guest);
              res.redirect("/guest_signIn");
              return;
            })
            .catch(err => {
              console.log(err.message, "Error in Creating Guest");
              res.redirect("/guest_signUp");
              return;
            });
        })
        .catch(e => {
          res.redirect("/guest_signUp");
          console.log(e);
        });
    })
    .catch(err => {
      console.log(err.message, "Error in Creating Guest");
      res.redirect("/guest_signUp");
    });
});

// guest Logout
router.post("/guest_logout", (req, res) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      // Sign-out successful.
      res.redirect("/guest_signin");
    })
    .catch(err => {
      console.log(err.message, "Error in Logging Out - Guest Logout");
    });
});

// college Profile Page for guest
router.get("/college_Profile", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && req.query.id !== "") {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          // send the college data
          collegesRef
            .doc(req.query.id)
            .get()
            .then(data => {
              if (!data.exists) {
                res.redirect("/guest_home");
                return;
              } else {
                var collegeData = data.data();
                var collegeName = collegeData.CollegeName;
                var { views } = collegeData;
                // update the view count
                if (!views.includes(user.email)) {
                  // set new view - user email
                  collegesRef
                    .doc(req.query.id)
                    .set(
                      {
                        views: [...views, user.email],
                      },
                      { merge: true }
                    )
                    .then(() => {
                      collegeData.type = capitalize(collegeData.type);
                      // extract all the completed sureys
                      let surveyData = [];
                      surveysRef
                        .get()
                        .then(snapshot => {
                          snapshot.forEach(temp_survey => {
                            // extract all the completed sureys
                            //console.log(collegeName);
                            if (
                              temp_survey.data().status == "completed" &&
                              temp_survey.data().collegeName == collegeName
                            ) {
                              surveyData.push(temp_survey.data());
                            }
                          });
                          //console.log(surveyData);
                          res.render("Guest/guestcollegeDetails.ejs", {
                            collegeData,
                            surveyData,
                            key,
                          });
                          return;
                        })
                        .catch(err => {
                          console.log(
                            err,
                            "Surveys Data not Fetched - Guest College Profile"
                          );
                          res.redirect("/guest_home");
                          return;
                        });
                    })
                    .catch(error => {
                      console.error("Error while updating views: ", error);
                    });
                }
                // else continue
                else {
                  collegeData.type = capitalize(collegeData.type);
                  // extract all the completed sureys
                  let surveyData = [];
                  surveysRef
                    .get()
                    .then(snapshot => {
                      snapshot.forEach(temp_survey => {
                        // extract all the completed sureys
                        //console.log(collegeName);
                        if (
                          temp_survey.data().status == "completed" &&
                          temp_survey.data().collegeName == collegeName
                        ) {
                          surveyData.push(temp_survey.data());
                        }
                      });
                      //console.log(surveyData);
                      res.render("Guest/guestcollegeDetails.ejs", {
                        collegeData,
                        surveyData,
                        key,
                      });
                      return;
                    })
                    .catch(err => {
                      console.log(
                        err,
                        "Surveys Data not Fetched - Guest College Profile"
                      );
                      res.redirect("/guest_home");
                      return;
                    });
                }
              }
            })
            .catch(err => {
              console.log(
                err,
                "Colleges Data not Fetched - Guest College Profile"
              );
              res.redirect("/guest_home");
              return;
            });
        } else {
          res.redirect("/guest_signin");
          return;
        }
      })
      .catch(err => {
        console.log(err, "NOt a Guest - Guest College Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/guest_signin");
    return;
  }
});

// college Profile Page for guest
router.get("/guest_search", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && req.query.id !== "") {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          UserSearchHistoryRef.doc(user.email)
            .get()
            .then(snapshot => {
              if (snapshot.data()) {
                let date = snapshot.data().date;
                // x 1000for chorome TimeStamp to Date
                date = new Date(date.seconds * 1000);
                res.render("Guest/college_search.ejs", {
                  key,
                  lastSearchDate: date,
                });
                return;
              }
            })
            .catch(err => {
              console.log(err.message, "No College Data Fetched - Guest Home");
              res.redirect("/guest_signIn");
              return;
            });
        } else {
          res.redirect("/guest_signin");
          return;
        }
      })
      .catch(err => {
        console.log(err, "Not a Guest - Guest College Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/guest_signin");
    return;
  }
});

//view search results
router.get("/search_result", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && req.query.id !== "") {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          res.redirect("guest_home");
        } else {
          res.redirect("/guest_signin");
          return;
        }
      })
      .catch(err => {
        console.log(err, "Not a Guest - Guest College Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/guest_signin");
    return;
  }
});

// filter the college based on user parameters
router.post("/search_result", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && req.query.id !== "") {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          collegesRef
            .get()
            .then(querySnapshot => {
              let User_collegeName = req.body.Q_collegeName;
              let User_type = req.body.Q_type;
              let User_address = req.body.Q_address;
              let colleges = [];

              querySnapshot.forEach(doc => {
                let temp = doc.data();
                temp.id = doc.id;
                colleges.push(temp);
              });

              if (User_collegeName.length > 0) {
                colleges = colleges.filter(cllg =>
                  cllg.CollegeName.toLowerCase().includes(
                    User_collegeName.toLowerCase()
                  )
                );
              }
              if (User_type.length > 0) {
                colleges = colleges.filter(
                  cllg => cllg.type.toLowerCase() === User_type.toLowerCase()
                );
              }
              if (User_address.length > 0) {
                colleges = colleges.filter(cllg =>
                  cllg.address
                    .toLowerCase()
                    .includes(User_address.toLowerCase())
                );
              }

              // update the user search History

              UserSearchHistoryRef.doc(user.email)
                .get()
                .then(doc => {
                  if (doc.exists) {
                    //console.log(doc.data());
                    let History = doc.data().History;
                    let userSearch = {
                      User_collegeName,
                      User_type,
                      User_address,
                    };
                    // Update History -- Select only top 10
                    if (colleges.length > 0) {
                      if (History.length > 10) {
                        History = History.splice(-1);
                        History = [userSearch, ...History];
                        //console.log(History);
                      } else {
                        History = [userSearch, ...History];
                      }
                      UserSearchHistoryRef.doc(user.email)
                        .set(
                          {
                            History,
                            date: new Date(),
                          },
                          { merge: true }
                        )
                        .then(() => {
                          res.render("Guest/search_result.ejs", {
                            User_collegeName,
                            User_type,
                            User_address,
                            count: colleges.length,
                            data: colleges,
                            key,
                          });
                          return;
                        })
                        .catch(err => {
                          console.log(err.message);
                          res.redirect("/guest_home");
                        });
                    } else {
                      res.render("Guest/search_result.ejs", {
                        User_collegeName,
                        User_type,
                        User_address,
                        count: colleges.length,
                        data: colleges,
                        key,
                      });
                      return;
                    }
                  } else {
                    res.redirect("/guest_signin");
                    return;
                  }
                })
                .catch(err => {
                  console.log(
                    err.message,
                    "No College Data Fetched - Guest Home"
                  );
                  res.redirect("/guest_home");
                  return;
                });
            })
            .catch(err => {
              console.log(err.message, "No College Data Fetched - Guest Home");
              res.redirect("/guest_home");
              return;
            });
        } else {
          res.redirect("/guest_signin");
          return;
        }
      })
      .catch(err => {
        console.log(err, "Not a Guest - Guest College Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/guest_signin");
    return;
  }
});

//compare_colleges Page for guest
router.get("/compare_colleges", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && req.query.id !== "") {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          collegesRef
            .get()
            .then(snapshot => {
              let colleges = [];
              snapshot.forEach(college_data => {
                let temp = college_data.data();
                temp.type = capitalize(temp.type);
                temp["id"] = college_data.id;
                colleges.push(temp);
              });

              res.render("Guest/compare_colleges.ejs", {
                data: colleges,
                key,
              });
              return;
            })
            .catch(err => {
              console.log(err.message, "No College Data Fetched - Guest Home");
              res.redirect("/guest_signIn");
              return;
            });
        } else {
          res.redirect("/guest_signin");
          return;
        }
      })
      .catch(err => {
        console.log(err, "Not a Guest - Guest College Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/guest_signin");
    return;
  }
});

// compare colleges Result Page for guest
router.post("/compare_result", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && req.query.id !== "") {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          collegesRef
            .get()
            .then(snapshot => {
              // variables to hold cllg data
              let collegeData1 = {};
              let collegeData2 = {};

              snapshot.forEach(college_data => {
                let temp = college_data.data();
                if (
                  temp.CollegeName.toLowerCase() ===
                  req.body.input_college_1.toLowerCase()
                ) {
                  temp.type = capitalize(temp.type);
                  temp["id"] = college_data.id;
                  collegeData1 = temp;
                }
                if (
                  temp.CollegeName.toLowerCase() ===
                  req.body.input_college_2.toLowerCase()
                ) {
                  temp.type = capitalize(temp.type);
                  temp["id"] = college_data.id;
                  collegeData2 = temp;
                }
              });

              // avg cllg rating
              let cllg1_avg_rating = [0, 0];
              let cllg2_avg_rating = [0, 0];

              // variable to store total number of surveys count

              let cllg1_total_surveys_count = 0;
              let cllg2_total_surveys_count = 0;

              // variable to store min and max rating value
              let cllg1_min_rating = [10, 10];
              let cllg2_min_rating = [10, 10];
              let cllg1_max_rating = [0, 0];
              let cllg2_max_rating = [0, 0];

              //console.log(req.body);
              surveysRef
                .get()
                .then(snapshot => {
                  snapshot.forEach(temp_survey => {
                    // extract survey ratings --- for avg rating
                    if (
                      temp_survey.data().status == "completed" &&
                      temp_survey.data().collegeName.toLowerCase() ==
                        req.body.input_college_1.toLowerCase()
                    ) {
                      cllg1_avg_rating[0] +=
                        temp_survey.data().scoreOfTeaching[0];
                      cllg1_avg_rating[1] +=
                        temp_survey.data().scoreOfTeaching[1];
                      cllg1_total_surveys_count++;

                      // update min rating
                      if (
                        cllg1_min_rating[0] >
                        temp_survey.data().scoreOfTeaching[0]
                      ) {
                        cllg1_min_rating[0] =
                          temp_survey.data().scoreOfTeaching[0];
                      }
                      if (
                        cllg1_min_rating[1] >
                        temp_survey.data().scoreOfTeaching[1]
                      ) {
                        cllg1_min_rating[1] =
                          temp_survey.data().scoreOfTeaching[1];
                      }
                      // update max rating
                      if (
                        cllg1_max_rating[0] <
                        temp_survey.data().scoreOfTeaching[0]
                      ) {
                        cllg1_max_rating[0] =
                          temp_survey.data().scoreOfTeaching[0];
                      }
                      if (
                        cllg1_max_rating[1] <
                        temp_survey.data().scoreOfTeaching[1]
                      ) {
                        cllg1_max_rating[1] =
                          temp_survey.data().scoreOfTeaching[1];
                      }
                    } else if (
                      temp_survey.data().status == "completed" &&
                      temp_survey.data().collegeName.toLowerCase() ==
                        req.body.input_college_2.toLowerCase()
                    ) {
                      cllg2_avg_rating[0] +=
                        temp_survey.data().scoreOfTeaching[0];
                      cllg2_avg_rating[1] +=
                        temp_survey.data().scoreOfTeaching[1];
                      cllg2_total_surveys_count++;

                      // update min rating
                      if (
                        cllg2_min_rating[0] >
                        temp_survey.data().scoreOfTeaching[0]
                      ) {
                        cllg2_min_rating[0] =
                          temp_survey.data().scoreOfTeaching[0];
                      }
                      if (
                        cllg2_min_rating[1] >
                        temp_survey.data().scoreOfTeaching[1]
                      ) {
                        cllg2_min_rating[1] =
                          temp_survey.data().scoreOfTeaching[1];
                      }
                      // update max rating
                      if (
                        cllg2_max_rating[0] <
                        temp_survey.data().scoreOfTeaching[0]
                      ) {
                        cllg2_max_rating[0] =
                          temp_survey.data().scoreOfTeaching[0];
                      }
                      if (
                        cllg2_max_rating[1] <
                        temp_survey.data().scoreOfTeaching[1]
                      ) {
                        cllg2_max_rating[1] =
                          temp_survey.data().scoreOfTeaching[1];
                      }
                    }
                  });

                  // console.log(cllg1_avg_rating);
                  // console.log(cllg2_avg_rating);
                  // console.log(cllg1_total_surveys_count);
                  // console.log(cllg2_total_surveys_count);

                  // calculate the avg rating
                  collegeData1["avg_rating"] = cllg1_avg_rating.map(
                    rating =>
                      Math.round(
                        (rating / cllg1_total_surveys_count + Number.EPSILON) *
                          100
                      ) / 100
                  );
                  collegeData2["avg_rating"] = cllg2_avg_rating.map(
                    rating =>
                      Math.round(
                        (rating / cllg2_total_surveys_count + Number.EPSILON) *
                          100
                      ) / 100
                  );

                  // storing min and max rating values
                  collegeData1["max_rating"] = cllg1_max_rating;
                  collegeData2["max_rating"] = cllg2_max_rating;
                  collegeData1["min_rating"] = cllg1_min_rating;
                  collegeData2["min_rating"] = cllg2_min_rating;

                  //total survey counts
                  collegeData1["totalSurveys"] = cllg1_total_surveys_count;
                  collegeData2["totalSurveys"] = cllg2_total_surveys_count;

                  //console.log(collegeData1);
                  //console.log(collegeData2);

                  res.render("Guest/compare_result.ejs", {
                    data: { collegeData1, collegeData2 },
                  });
                  return;
                })
                .catch(err => {
                  console.log(
                    err,
                    "Surveys Data not Fetched - Guest College Profile"
                  );
                  res.redirect("/guest_home");
                  return;
                });
            })
            .catch(err => {
              console.log(err.message, "No College Data Fetched - Guest Home");
              res.redirect("/guest_signIn");
              return;
            });
        } else {
          res.redirect("/guest_signin");
          return;
        }
      })
      .catch(err => {
        console.log(err, "Not a Guest - Guest College Profile");
        res.redirect("/");
        return;
      });
  } else {
    res.redirect("/guest_signin");
    return;
  }
});

// Show all queries
router.get("/show_request", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user && user.email) {
    //console.log(user.email);
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          var Queries = [];
          QueriesRef.get()
            .then(result => {
              result.forEach(tempdata => {
                const query = tempdata.data();
                const text = decrypt(query.user);
                //console.log(text);
                if (text.toLowerCase() === user.email.toLowerCase()) {
                  query["id"] = tempdata.id;
                  Queries.push(query);
                }
              });
              let pending = Queries.filter(query => query.status === "Pending");
              let rejected = Queries.filter(
                query => query.status === "Rejected"
              );
              let approved = Queries.filter(
                query => query.status === "Approved"
              );

              res.render("Guest/show_request.ejs", {
                pending: pending.length,
                rejected: rejected.length,
                approved: approved.length,
              });

              return;
            })
            .catch(err => {
              c;
              console.log(err.message, "Invalid Guest -  List of Queries");
              return;
            });
        } else {
          console.log("Not a guest");
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log("Error", err.message);
        res.redirect("/");
        return;
      });
  } else {
    console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

// Show all user pending queries
router.get("/pending_request", (req, res) => {
  var user = firebase.auth().currentUser;
  if (user) {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          var Queries = [];
          QueriesRef.get()
            .then(result => {
              result.forEach(tempdata => {
                const query = tempdata.data();
                const text = decrypt(query.user);
                //console.log(text);
                if (text.toLowerCase() === user.email.toLowerCase()) {
                  query["id"] = tempdata.id;
                  Queries.push(query);
                }
              });

              let pending = Queries.filter(query => query.status === "Pending");

              res.render("Guest/pending_queries.ejs", {
                data: pending,
                pending: pending.length,
              });
              return;
            })
            .catch(err => {
              console.log(err.message, "Invalid Admin -  List of Queries");
              return;
            });
        } else {
          console.log("Not a guest");
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log("Error", err.message);
        res.redirect("/");
        return;
      });
  } else {
    console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

// Show all user rejected queries
router.get("/rejected_request", (req, res) => {
  var user = firebase.auth().currentUser;

  if (user) {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          var Queries = [];
          QueriesRef.get()
            .then(result => {
              result.forEach(tempdata => {
                const query = tempdata.data();
                const text = decrypt(query.user);
                //console.log(text);
                if (text.toLowerCase() === user.email.toLowerCase()) {
                  query["id"] = tempdata.id;
                  Queries.push(query);
                }
              });

              let rejected = Queries.filter(
                query => query.status === "Rejected"
              );

              res.render("Guest/rejected_queries.ejs", {
                data: rejected,
                rejected: rejected.length,
              });
              return;
            })
            .catch(err => {
              console.log(err.message, "Invalid Admin -  List of Queries");
              return;
            });
        } else {
          console.log("Not a guest");
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log("Error", err.message);
        res.redirect("/");
        return;
      });
  } else {
    console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

// Show all user approved queries
router.get("/approved_request", (req, res) => {
  var user = firebase.auth().currentUser;

  if (user) {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          var Queries = [];
          QueriesRef.get()
            .then(result => {
              result.forEach(tempdata => {
                const query = tempdata.data();
                const text = decrypt(query.user);
                //console.log(text);
                if (text.toLowerCase() === user.email.toLowerCase()) {
                  query["id"] = tempdata.id;
                  Queries.push(query);
                }
              });

              let approved = Queries.filter(
                query => query.status === "Approved"
              );

              res.render("Guest/approved_queries.ejs", {
                data: approved,
                approved: approved.length,
              });
              return;
            })
            .catch(err => {
              console.log(err.message, "Invalid Admin -  List of Queries");
              return;
            });
        } else {
          console.log("Not a guest");
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log("Error", err.message);
        res.redirect("/");
        return;
      });
  } else {
    console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

// College Recommendations
router.get("/recommendations", (req, res) => {
  var user = firebase.auth().currentUser;

  if (user) {
    Guests.doc(user.email)
      .get()
      .then(doc => {
        if (doc.exists) {
          UserSearchHistoryRef.doc(user.email)
            .get()
            .then(snapshot => {
              if (snapshot.data()) {
                let user_history = snapshot.data().History;
                if (user_history && user_history.length > 0) {
                  user_history = user_history.map(a => a.User_type);
                  user_history = user_history.filter(el => el !== "");
                  let map = {};
                  user_history.forEach((value, i) => {
                    if (!map[value]) {
                      map[value] = 0;
                    }
                    map[value] += 1;
                  });
                  // console.log(user_history);
                  let sortList = [];
                  sortList = Object.entries(map).sort((a, b) => {
                    if (b[1] > a[1]) return 1;
                    else if (b[1] < a[1]) return -1;
                    else return 0;
                  });

                  sortList = sortList.map(el => el[0].toLocaleLowerCase());
                  let labels = [];
                  if (sortList.length == 1) labels = sortList.slice(0, 1);
                  else {
                    labels = sortList.slice(0, 2);
                  }
                  //res.render("Guest/recommendation.ejs");

                  collegesRef
                    .get()
                    .then(cllgDoc => {
                      let recomd_cllgs = [];
                      cllgDoc.forEach(doc => {
                        recomd_cllgs.push({ id: doc.id, ...doc.data() });
                      });
                      // filter colleges based on labels
                      recomd_cllgs = recomd_cllgs.filter(cllg =>
                        labels.includes(cllg.type.toLowerCase())
                      );
                      // res.send({ sortList, labels, recomd_cllgs });
                      res.render("Guest/recommendation.ejs", {
                        data: recomd_cllgs,
                        key,
                      });
                      return;
                    })
                    .catch(err => {
                      console.log("Recommendations Cllg not fetch");
                      console.log(err.message);
                      res.redirect("/guest_home");
                      return;
                    });
                  return;
                } else {
                  res.render("Guest/recommendation.ejs", {
                    data: [],
                    key,
                  });
                  return;
                }
              } else {
                res.render("Guest/recommendation.ejs", {
                  data: [],
                  key,
                });
                return;
              }
            })
            .catch(err => {
              console.log(err.message, "Invalid Admin -  Recommendations");
              return;
            });
        } else {
          console.log("Not a guest");
          res.redirect("/");
          return;
        }
      })
      .catch(err => {
        console.log("Error", err.message);
        res.redirect("/");
        return;
      });
  } else {
    console.log("Not Auth User Found");
    res.redirect("/guest_signIn");
    return;
  }
});

module.exports = router;

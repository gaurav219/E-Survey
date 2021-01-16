const express = require('express');
const router = express.Router();
const firebase = require('firebase');
require('dotenv').config();

// Firebase Config
const firebaseConfig = {
	apiKey: process.env.API_KEY,
	authDomain: process.env.PROJECT_ID + '.firebaseapp.com',
	databaseURL: 'https://' + process.env.PROJECT_ID + '.firebaseio.com',
	projectId: process.env.PROJECT_ID,
	storageBucket: process.env.PROJECT_ID + '.appspot.com',
	messagingSenderId: process.env.SENDER_ID,
	appId: process.env.APP_ID,
	measurementId: process.env.G_MEASUREMENT_ID
};

// firebase initialized and Ref variables created
if (!firebase.apps.length) {
	firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
// Collection Ref
const collegesRef = db.collection('colleges');
const questionsRef = db.collection('questions');
const visitorDataRef = db.collection('Visiting_Officer_Data');
const adminRef = db.collection('Admin');
const surveysRef = db.collection('surveys');
const AnswerRef = db.collection('question_wise_ratings');

// survey questions - Global Variables
var questions = {};
const collegesNames = [];
const visitor_list = [];

// get the list of colleges from FireStore
collegesRef
	.get()
	.then((snapshot) => {
		snapshot.forEach((doc) => {
			//console.log(doc.data().CollegeName);
			collegesNames.push(doc.data().CollegeName);
		});
		// console.log(collegesNames);
	})
	.catch((err) => {
		console.log(err, 'getListOfColleges');
	});

// get the list of visitors from FireStore
visitorDataRef
	.get()
	.then((snapshot) => {
		snapshot.forEach((doc) => {
			visitor_list.push(doc.id);
		});
		// console.log(visitor_list);
	})
	.catch((err) => {
		console.log(err, 'getListOfVisitors');
	});

//Capital first letter of a string
const capitalize = (s) => {
	if (typeof s !== 'string') return '';
	return s.charAt(0).toUpperCase() + s.slice(1);
};

// @route       GET /admin_login
// @description Admin_login route
// @access      Public
router.get('/admin_login', (req, res) => {
	res.render('Admin/admin_login.ejs');
});

// REGISTERING THE USER IS DONE BY ADMIN

// // Get - visitor signup Page
router.get('/visitor_signUp', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						res.render('Admin/visitor_signup.ejs');
						return;
					}
				});
			})
			.catch((err) => {
				console.log(err.message, 'Visitor SignUp Admin UnAuth ');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
	}
});

router.post('/visitor_signUp', (req, res) => {
	const new_Visitor_Data = {
		V_id: req.body.email,
		age: '',
		contactNumber: '',
		firstname: req.body.firstname,
		gmailID: req.body.email,
		lastname: req.body.lastname,
		middlename: req.body.middlename
	};

	new_Visitor_Data['pass'] = req.body.password;

	visitorDataRef
		.doc(req.body.email)
		.set(new_Visitor_Data)
		.then((err) => {
			if (err) {
				console.log(err, 'VISITOR ERROR');
				res.redirect('/visitor_signUp');
				return;
			} else {
				console.log('successfully created visitor');
				res.redirect('/visiting_Officer_list');
				return;
			}
		})
		.catch((e) => {
			console.log(e, 'Error setting a Visitor');
			return;
		});
});

// post - admin login INCOMPLETE
router.post('/admin_login', (req, res) => {
	if (firebase.auth.currentUser) {
		firebase
			.auth()
			.signOut()
			.then(() => {
				firebase
					.auth()
					.signInWithEmailAndPassword(req.body.admin_username, req.body.admin_password)
					.then(() => {
						var user = firebase.auth().currentUser;
						adminRef
							.get()
							.then((snapshot) => {
								snapshot.forEach((doc) => {
									var temp_username = doc.id;
									if (temp_username === user.email) {
										res.redirect('/admin_home');
										return;
									}
								});
							})
							.catch((err) => {
								console.log(err.message, 'Not an Admin - Admin Login');
								res.redirect('/admin_login');
								return;
							});
					})
					.catch((err) => {
						console.log(err.message, 'Invalid Credentials - Admin Login');
						res.render('Admin/admin_login.ejs', { msg: err.message.toString() });
						return;
					});
			})
			.catch((err) => {
				console.log(err.message, 'InComplete SignOut - admin login');
				return;
			});
	} else {
		firebase
			.auth()
			.signInWithEmailAndPassword(req.body.admin_username, req.body.admin_password)
			.then(() => {
				var user = firebase.auth().currentUser;
				adminRef
					.get()
					.then((snapshot) => {
						snapshot.forEach((doc) => {
							var temp_username = doc.id;
							if (temp_username === user.email) {
								res.redirect('/admin_home');
								return;
							}
						});
					})
					.catch((err) => {
						console.log(err.message, 'Not an Admin - Admin Login');
						res.redirect('/admin_login');
						return;
					});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Credentials - Admins Login');
				res.render('Admin/admin_login.ejs', { msg: err.message.toString() });
				return;
			});
	}
});

// admin logout
router.get('/admin_logout', (req, res) => {
	firebase
		.auth()
		.signOut()
		.then(() => {
			// Sign-out successful.
			res.redirect('/admin_login');
			return;
		})
		.catch((err) => {
			console.log(err.message, 'Incomplete Logout');
			res.redirect('/');
		});
});

router.get('/admin_home', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						res.render('Admin/admin_home.ejs', { user });
						return;
					}
				});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Admin - Home');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
	}
});

// list of all the Visiting Officers
router.get('/visiting_Officer_list', (req, res) => {
	console.log('INSIDE VISITING');
	var user = firebase.auth().currentUser;
	if (user) {
		console.log('user');
		console.log(user.email, 'USER EMAIL');

		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						console.log('USER IS ADMIN');
						var Visiting_Officer_Data = [];
						visitorDataRef
							.get()
							.then((result) => {
								result.forEach((tempdata) => {
									Visiting_Officer_Data.push(tempdata.data());
								});
								console.log(Visiting_Officer_Data);
								res.render('Admin/visitorList.ejs', { data: Visiting_Officer_Data });
								return;
							})
							.catch((err) => {
								console.log(err.message, 'Invalid Admin -  List of Visiting Officers');
								return;
							});
					}
				});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Admin - List of Visiting Officers');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
		return;
	}
});

//Remove Visiting Officers
router.get('/remove_officers', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				var Visiting_Officer_Data = [];
				visitorDataRef
					.get()
					.then((result) => {
						result.forEach((tempdata) => {
							Visiting_Officer_Data.push(tempdata.data());
						});
						snapshot.forEach((doc) => {
							var temp_username = doc.id;
							if (temp_username === user.email) {
								console.log(Visiting_Officer_Data);
								res.render('Admin/visitorRemoveList.ejs', {
									data: Visiting_Officer_Data
								});
								return;
							}
						});
					})
					.catch((err) => {
						console.log(err.message, 'Invalid Visitor - Remove Visiting Officers');
						return;
					});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Admin -  Remove Visiting Officers');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
	}
});

//Remove Officer
router.get('/removeOfficer/:id', (req, res) => {
	const email = req.params.id;
	visitorDataRef
		.doc(email)
		.delete()
		.then(() => {
			console.log('Removed Successfully');
			res.redirect('/remove_officers');
			return;
		})
		.catch((e) => {
			console.log(e.message, 'Invalid Visitor - Remove Visiting Officers');
			res.redirect('/remove_officers');
		});
});

// Assign New Survey
router.get('/assign_new_survey', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						console.log(collegesNames);
						res.render('Admin/new_survey.ejs', {
							collegesNames: collegesNames,
							visitor_list: visitor_list
						});
						return;
					}
				});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Admin - New Survey');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
	}
});

// Assign new Survey --- POST
router.post('/assign_new_survey', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						var assignDate = firebase.firestore.Timestamp.fromDate(new Date(req.body.dataOfSurvey));
						var collegeLocation = [];
						collegesRef
							.get()
							.then((response) => {
								response.forEach((doc) => {
									if (doc.data()) {
										collegeLocation = doc.data().coordinates;
									}
								});
								surveysRef
									.add({
										assignDate: assignDate,
										collegeName: req.body.college,
										dateOfSurvey: '',
										location: collegeLocation,
										scoreOfTeaching: [],
										status: 'open',
										visitorId: req.body.visitorID
									})
									.then(function(docRef) {
										console.log('Document written with ID: ', docRef.id);
										surveysRef
											.doc(docRef.id)
											.update({
												id: docRef.id.toString()
											})
											.then(function() {
												res.redirect('/show_Surveys');
												return;
											})
											.catch(function(error) {
												console.error('Error updating document: ', error);
												res.redirect('/assign_new_survey');
												return;
											});
									})
									.catch(function(error) {
										console.error('Error adding document: ', error);
										res.redirect('/assign_new_survey');
										return;
									});
							})
							.catch((err) => {
								console.log(err.message, 'College Data not Fetched - New Survey POST');
								res.redirect('/admin_home');
								return;
							});
					}
				});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Admin - New Survey - POST');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
		return;
	}
});

// visitor Profile Details
router.get('/visitor_data', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						// res.send(req.query.id)
						visitorDataRef
							.doc(req.query.id)
							.get()
							.then((doc) => {
								if (doc.exists) {
									res.render('Admin/visitorProfile.ejs', { user_data: doc.data() });
									return;
								} else {
									res.redirect('/visitorList');
									return;
								}
							})
							.catch((err) => {
								console.log(err.message, 'Invalid Visitor - Visitor Data');
								res.redirect('/');
								return;
							});
					}
				});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Admin - Visitor Data');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
		return;
	}
});

// Show all SurveysData
router.get('/show_Surveys', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				var All_Surveys = [];
				surveysRef
					.get()
					.then((result) => {
						result.forEach((tempdata) => {
							var tempData = tempdata.data();
							tempData['id'] = tempdata.id;
							All_Surveys.push(tempData);
						});
						snapshot.forEach((doc) => {
							var temp_username = doc.id;
							if (temp_username === user.email) {
								// console.log(All_Surveys);
								var Pending_Surveys = [],
									Completed_Surveys = [];
								All_Surveys.forEach((survey) => {
									if (survey.status == 'open') {
										var date = new Date(survey.assignDate.seconds * 1000);
										survey['assignDateOfSurvey'] = date;
										survey['status'] = capitalize(survey['status']);
										Pending_Surveys.push(survey);
									} else {
										survey['status'] = capitalize(survey['status']);
										Completed_Surveys.push(survey);
									}
								});
								//console.log(Pending_Surveys);
								//console.log(Completed_Surveys);
								res.render('Admin/showAllSureys.ejs', {
									pending_surveys: Pending_Surveys,
									completed_surveys: Completed_Surveys
								});
								return;
							}
						});
					})
					.catch((err) => {
						console.log(err.message, 'Invalid Survey - All Surveys Data');
						res.redirect('/admin_home');
						return;
					});
			})
			.catch((err) => {
				console.log(err.message, 'Invalid Admin - All Surveys Data');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
	}
});

//show a survey VIA id to ADMIN ONLY
router.get('/survey_data', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						// if the Survey ID in query is empty ""
						if (req.query.id.length == 0) {
							res.redirect('/admin_home');
							return;
						} else {
							surveysRef
								.doc(req.query.id)
								.get()
								.then((doc) => {
									if (!doc.exists) {
										res.redirect('/');
										return;
									} else {
										// res.send(doc.data());
										var survey_Data = doc.data();
										survey_Data['surveyID'] = req.query.id;
										if (survey_Data.status === 'open') {
											//res.send(doc.data());
											var date = new Date(survey_Data.assignDate.seconds * 1000);
											survey_Data['assignDateOfSurvey'] = date;
											survey_Data['status'] = capitalize(survey_Data['status']);
											res.render('Admin/admin_surveyData.ejs', {
												surveyData: survey_Data
											});
											return;
										} else {
											// console.log(survey_Data);
											// console.log(questions);
											//res.send(survey_Data)
											questionsRef
												.get()
												.then((Response) => {
													Response.forEach((doc) => {
														//console.log(doc.id);
														questions[doc.id] = doc.data();
													});
													// var date = new Date(survey_Data.dateOfSurvey.seconds * 1000);
													// survey_Data['DateOfSurvey'] = date;
													survey_Data['surveyID'] = req.query.id;
													survey_Data['status'] = capitalize(survey_Data['status']);
													//console.log(survey_Data);
													AnswerRef.doc(req.query.id)
														.get()
														.then((response) => {
															var ratings = [];
															ratings.push(response.data()['College Environment']);
															ratings.push(response.data()['Teaching Learning Process']);

															res.render('Admin/admin_surveyData.ejs', {
																surveyData: survey_Data,
																questions: questions,
																ratings: ratings
															});
															return;
														})
														.catch((err) => {
															console.log(err, 'Invalid Answers - Single Survey Data');
															res.redirect('/admin_home');
															return;
														});
												})
												.catch((err) => {
													console.log(err, 'Invalid Questions - Single Survey Data');
													res.redirect('/admin_home');
													return;
												});
										}
									}
								})
								.catch((err) => {
									console.log(err, 'Invalid Survey Data - Single Survey Data');
									res.redirect('/admin_home');
								});
						}
					}
				});
			})
			.catch((err) => {
				console.log(err, 'Invalid Admin - Single Survey Data');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/admin_login');
		return;
	}
});

// add a college -- Admin Only
router.get('/add_college', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						res.render('Admin/admin_add_college.ejs');
						return;
					}
				});
			})
			.catch((err) => {
				console.log(err, 'Invalid Answers - Add College Data');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/');
		return;
	}
});

// add college to the database  --- POST
router.post('/add_college', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		adminRef
			.get()
			.then((snapshot) => {
				snapshot.forEach((doc) => {
					var temp_username = doc.id;
					if (temp_username === user.email) {
						var lat = parseFloat(req.body.latitude);
						var long = parseFloat(req.body.longitude);
						collegesRef
							.add({
								Affiliations: '',
								C_id: req.body.collegeID,
								CollegeName: req.body.college_fullname,
								address: req.body.address,
								coordinates: new firebase.firestore.GeoPoint(lat, long),
								type: req.body.Type,
								website: ''
							})
							.then(function(docRef) {
								console.log('College Add with ID: ', docRef.id);
								collegesNames.push(req.body.college_fullname);
								res.redirect('/admin_home');
								return;
							})
							.catch(function(error) {
								console.error('Error adding college: ', error);
								res.redirect('/add_college');
								return;
							});
					}
				});
			})
			.catch((err) => {
				console.log(err, 'Invalid Answers - Add College Data - POST');
				res.redirect('/admin_login');
				return;
			});
	} else {
		res.redirect('/');
	}
});

// ---------------------- END ADMIN routes -------------------------------

// ---------------------- Show Surveys -----------------------------------
router.get('/survey_detail', (req, res) => {
	var user = firebase.auth().currentUser;
	// if the user exsists
	if (user) {
		// if the Survey ID in query is empty ""
		if (req.query.id.length == 0) {
			res.redirect('/visitor_home');
			return;
		} else {
			visitorDataRef
				.doc(user.email)
				.get()
				.then((doc) => {
					if (doc.exists) {
						surveysRef
							.doc(req.query.id)
							.get()
							.then((doc) => {
								if (!doc.exists) {
									res.redirect('/');
									return;
								} else {
									// res.send(doc.data());
									var survey_Data = doc.data();
									if (survey_Data.status === 'open') {
										res.redirect('/past_surveys');
										return;
									} else {
										// var date = new Date(survey_Data.dateOfSurvey.seconds * 1000);
										// survey_Data['DateOfSurvey'] = date;
										survey_Data['surveyID'] = req.query.id;
										//console.log(survey_Data);
										AnswerRef.doc(req.query.id)
											.get()
											.then((response) => {
												var ratings = [];
												ratings.push(response.data()['College Environment']);
												ratings.push(response.data()['Teaching Learning Process']);

												res.render('Visitor/survey.ejs', {
													surveyData: survey_Data,
													questions: questions,
													ratings: ratings
												});
												return;
											})
											.catch((err) => {
												console.log(err, 'Invalid Answers - Visitor Survey Data');
												res.redirect('/visitor_home');
												return;
											});
									}
								}
							})
							.catch((err) => {
								console.log(err, 'Invalid Survey - Visitor Survey Data');
								res.redirect('/visitor_home');
								return;
							});
					}
				})
				.catch((err) => {
					console.log(err, 'INvalid Vistior - Survey Data');
					res.redirect('/visitor_signIn');
					return;
				});
		}
	} else {
		res.redirect('/');
	}
});

// ----------------- End Show Surveys ---------------------

// ------------ College List route ----------------------
router.get('/colleges', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		visitorDataRef
			.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					// res.send(req.query.id)
					collegesRef
						.get()
						.then((response) => {
							var collegeData = [];
							response.forEach((doc) => {
								var data = doc.data();
								data['c_id'] = doc.id;
								collegeData.push(data);
								data['type'] = capitalize(data['type']);
							});
							//console.log(collegeData);
							res.render('Visitor/collegelist.ejs', { collegeData });
							return;
						})
						.catch((err) => {
							console.log(err, 'INvalid College Data - Colleges Data Visitor');
							res.redirect('/');
							return;
						});
				} else {
					res.redirect('/visitor_signIn');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'INvalid Visitor - Colleges Data Visitor');
				res.redirect('/visitor_signIn');
			});
	} else {
		res.redirect('/visitor_signIn');
	}
});

// college profile
router.get('/college_detail', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user && req.query.id !== '') {
		visitorDataRef
			.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					// send the college data
					collegesRef
						.doc(req.query.id)
						.get()
						.then((data) => {
							if (!data.exists) {
								res.redirect('/visitor_home');
								return;
							} else {
								var collegeData = data.data();
								var collegeName = data.data().CollegeName;

								collegeData.type = capitalize(collegeData.type);
								// extract all the completed sureys
								var surveyData = [];
								surveysRef
									.get()
									.then((snapshot) => {
										snapshot.forEach((temp_survey) => {
											// extract all the completed sureys
											console.log(temp_survey.data().collegeName);
											if (
												temp_survey.data().status == 'completed' &&
												temp_survey.data().collegeName == collegeName
											) {
												surveyData.push(temp_survey.data());
											}
										});
										//console.log(surveyData);
										res.render('Visitor/collegeDetails.ejs', {
											collegeData,
											surveyData
										});
										return;
									})
									.catch((err) => {
										console.log(err, 'INvalid Survey - Colleges Profile Visitor');
										res.redirect('/visitor_home');
										return;
									});
							}
						})
						.catch((err) => {
							console.log(err, 'INvalid Colleges - Colleges Profile Visitor');
							res.redirect('/visitor_home');
							return;
						});
				} else {
					res.redirect('/');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'INvalid Visitor - Colleges Profile Visitor');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/visitor_home');
		return;
	}
});

// email verification all users
router.get('/getEmailVerified', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		if (user.emailVerified) {
			res.redirect('/visitor_home');
			return;
		} else {
			user
				.sendEmailVerification()
				.then(() => {
					res.redirect('/visitor_home');
					return;
				})
				.catch((err) => {
					console.log(err, 'Invalid Email verification-Visitor');
					res.redirect('/');
				});
		}
	} else {
		res.redirect('/');
	}
});

module.exports = router;

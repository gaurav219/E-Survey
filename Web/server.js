const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const firebase = require('firebase');
require('dotenv').config();

const PORT = process.env.PORT || 9000;

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

// view engine setup
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

//setup public folder
app.use(express.static('./public'));
// setup body-parser urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// firebase initialized and Ref variables created
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// Collection Ref
const collegesRef = db.collection('colleges');
const questionsRef = db.collection('questions');
const visitorDataRef = db.collection('Visiting_Officer_Data');
const adminRef = db.collection('Admin');
const surveysRef = db.collection('surveys');
const Guests = db.collection('Guests');
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

//home page
app.get('/', (req, res) => {
	res.render('index.ejs');
});

// Get - visitor login Page
app.get('/visitor_signIn', (req, res) => {
	res.render('Visitor/visitor_signin.ejs', { msg: '' });
});

// Post - visitor login Page (login the user)

// app.post('/visitor_signIn', (req, res) => {
// 	// sign in
// 	if (firebase.auth().currentUser) {
// 		firebase.auth().signOut.then(() => {
// 			firebase
// 				.auth()
// 				.signInWithEmailAndPassword(req.body.email, req.body.password)
// 				.then(() => {
// 					// var user = firebase.auth().currentUser;
// 					res.redirect('/visitor_home');
// 					return;
// 				})
// 				.catch((e) => console.log(e, 'Visitor SignIn'));
// 		});
// 	} else {
// 		firebase
// 			.auth()
// 			.signInWithEmailAndPassword(req.body.email, req.body.password)
// 			.then(() => {
// 				// var user = firebase.auth().currentUser;
// 				res.redirect('/visitor_home');
// 				return;
// 			})
// 			.catch((e) => console.log(e, 'Visitor SignIn UnAuth'));
// 	}

app.post('/visitor_signIn', (req, res) => {
	// sign in
	if (firebase.auth().currentUser) {
		firebase.auth().signOut().then(() => {
			firebase
				.auth()
				.createUserWithEmailAndPassword(req.body.email, req.body.password)
				.then(() => {
					visitorDataRef
						.doc(req.body.email)
						.get()
						.update(new_visitor)
						.then(() => {
							console.log('Created User');
							res.redirect('/visitor_home');
							return;
						})
						.catch((e) => console.log(e, 'Error updating visitor'));
				})
				.catch((e) => {
					switch (e.code) {
						case 'auth/email-already-in-use':
							firebase
								.auth()
								.signInWithEmailAndPassword(req.body.email, req.body.password)
								.then(() => {
									console.log('Successfully Signed In');
									res.redirect('/visitor_home');
									return;
								})
								.catch((err) => {
									switch (err.code) {
										case 'auth/wrong-password':
											res.render('Visitor/visitor_signin', {
												msg: 'Invalid User or Credentials'
											});
											break;
										default:
											console.log(e.message);
											break;
									}
								})
								.catch((err) => {
									switch (err.code) {
										case 'auth/wrong-password':
											res.render('Visitor/visitor_signin', {
												msg: 'Invalid User or Credentials'
											});
											break;
										default:
											console.log(e.message);
											break;
									}
									console.log(err, 'Cannot Sign In');
								});
							break;
						case 'auth/wrong-password':
							res.render('Visitor/visitor_signin', { msg: 'Invalid Credentials' });
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
						pass: firebase.firestore.FieldValue.delete()
					})
					.then(() => {
						console.log('Created User');
						res.redirect('/visitor_home');
						return;
					})
					.catch((e) => console.log(e, 'Error Updating Visitor'));
			})
			.catch((e) => {
				// console.log(e.code, "E_CODE");
				switch (e.code) {
					case 'auth/email-already-in-use':
						firebase
							.auth()
							.signInWithEmailAndPassword(req.body.email, req.body.password)
							.then(() => {
								console.log('Successfully Signed In');
								res.redirect('/visitor_home');
								return;
							})
							.catch((err) => {
								switch (err.code) {
									case 'auth/wrong-password':
										res.render('Visitor/visitor_signin', {
											msg: 'Invalid User or Credentials'
										});
										break;
									default:
										console.log(e.message);
										break;
								}
								console.log(err, 'Cannot Sign In');
							});
						break;
					default:
						console.log(e.message);
						break;
				}
			});
	}
	// fcd69665481adce159623b2e146dfb6d5e399173
});

// REGISTERING THE USER IS DONE BY ADMIN

// // Get - visitor signup Page
app.get('/visitor_signUp', (req, res) => {
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

// Post - visitor signup Page (Register the visitor)
// ** ADD A CHECK THAT THIS ROUTE CAN ONLY BE ACCESSED BY ADMIN ONLY
// <<<<<<< HEAD
// app.post('/visitor_signUp', (req, res) => {
// 	const new_Visitor_Data = {
// 		V_id: req.body.email,
// 		age: '',
// 		contactNumber: '',
// 		firstname: req.body.firstname,
// 		gmailID: req.body.email,
// 		lastname: req.body.lastname,
// 		middlename: req.body.middlename
// 	};

// 	firebase
// 		.auth()
// 		.createUserWithEmailAndPassword(req.body.email, req.body.password)
// 		.then(() => {
// 			visitorDataRef
// 				.doc(req.body.email) // set the unique key as UserEmail
// 				.set(new_Visitor_Data) // added the data
// 				.then((err) => {
// 					if (err) {
// 						console.log(err, 'VISITOR ERROR');
// 						res.redirect('/visitor_signUp');
// 						return;
// 					} else {
// 						firebase.auth().signOut().then(() => {
// 							firebase.auth().signInWithEmailAndPassword('admin@survey.com', 'admin2020').then(() => {
// 								console.log('INSIDE THEN');
// 								res.redirect('/visiting_Officer_list');
// 								return;
// 							});
// 						});
// 					}
// 				})
// 				.catch((err) => {
// 					console.log(err.message, 'Visitor SignUp Failed');
// 					res.redirect('/visitor_signUp');
// 					return;
// 				});
// 		})
// 		.catch((err) => {
// 			console.log(err.message, ' Duplicate Visitor SignUp Failed');
// 			res.redirect('/visitor_signUp');
// 		});
// =======
app.post('/visitor_signUp', (req, res) => {
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

	// firebase
	//   .auth()
	//   .createUserWithEmailAndPassword(req.body.email, req.body.password)
	//   .then(() => {
	//     visitorDataRef
	//       .doc(req.body.email) // set the unique key as UserEmail
	//       .set(new_Visitor_Data) // added the data
	//       .then((err) => {
	//         if (err) {
	//           console.log(err, "VISITOR ERROR");
	//           res.redirect("/visitor_signUp");
	//           return;
	//         } else {
	//           firebase
	//             .auth()
	//             .signOut()
	//             .then(() => {
	//               firebase
	//                 .auth()
	//                 .signInWithEmailAndPassword(
	//                   "<INSERT YOUR EMAIL",
	//                   "<INSERT PASS>"
	//                 )
	//                 .then(() => {
	//                   console.log("INSIDE THEN");
	//                   res.redirect("/visiting_Officer_list");
	//                   return;
	//                 });
	//             });
	//         }
	//       })
	//       .catch((err) => {
	//         console.log(err.message, "Visitor SignUp Failed");
	//         res.redirect("/visitor_signUp");
	//         return;
	//       });
	//   })
	//   .catch((err) => {
	//     console.log(err.message, " Duplicate Visitor SignUp Failed");
	//     res.redirect("/visitor_signUp");
	//   });
	// fcd69665481adce159623b2e146dfb6d5e399173
});

// visitor Logout
app.post('/visitor_logout', (req, res) => {
	firebase
		.auth()
		.signOut()
		.then(() => {
			//console.log('Signed out visitor');
			// Sign-out successful.
			res.redirect('/visitor_signin');
			return;
		})
		.catch((err) => {
			//console.log('Signing out visitor error');
			console.log(err.message, 'Signing out visitor error');
		});
});

// Visitor Update Profile
app.get('/updateProfile_visitor', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		visitorDataRef
			.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					//console.log(doc.data());
					res.render('Visitor/visitor_update_profile.ejs', {
						user_data: doc.data(),
						user: user
					});
					return;
				} else {
					res.redirect('/visitor_signIn');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'Not a Visitor  - Update profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/visitor_signIn');
	}
});

// visitor profile update --- POST
// update the data in the firestore
app.post('/updateProfile_visitor', (req, res) => {
	var updated_user_data = req.body;
	var user = firebase.auth().currentUser;

	visitorDataRef
		.doc(user.email)
		.update({
			middlename: updated_user_data.middlename.toString(),
			age: updated_user_data.age.toString(),
			contactNumber: updated_user_data.contactNumber.toString()
		})
		.then(function() {
			//console.log("Document successfully written!");
			res.redirect('/visitor_Profile');
			return;
		})
		.catch(function(error) {
			console.error('Error writing document: ', error);
			res.send(err);
		});
});

// Visitor Home Page
app.get('/visitor_home', (req, res) => {
	const user = firebase.auth().currentUser;

	if (user) {
		visitorDataRef
			.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					res.render('Visitor/visitor_home.ejs', { useremail: user.email });
					return;
				} else {
					res.redirect('/');
					return;
				}
			})
			.catch((err) => {
				console.log(err.message, 'Not a Visitor - Visitor Home');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/visitor_signIn');
		return;
	}
});

//Visitor Profile Page
app.get('/visitor_Profile', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		visitorDataRef
			.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					//console.log(doc.data());
					// console.log(user);
					res.render('Visitor/visitor_profile.ejs', {
						user_data: doc.data(),
						user: user
					});
					return;
				} else {
					res.redirect('/visitor_signIn');
					return;
				}
			})
			.catch((err) => {
				console.log(err.message, 'Not a Visitor - Visitor Profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/visitor_signIn');
		return;
	}
});

//Visitor past suveys page
app.get('/past_surveys', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		var pending_surveys = [],
			completed_surveys = [];
		questionsRef
			.get()
			.then((Response) => {
				Response.forEach((doc) => {
					//console.log(doc.id);
					questions[doc.id] = doc.data();
				});
				surveysRef
					.get()
					.then((response) => {
						response.forEach((doc) => {
							// console.log(doc.id);
							// console.log(doc.data());
							var temp = {};

							if (doc.data().visitorId == user.email) {
								if (doc.data().status == 'completed') {
									// add the data to the List
									temp = doc.data();
									temp['Sid'] = doc.id;
									completed_surveys.push(temp);
								} else {
									// survey is completed
									// add the data to the List
									// x 1000for chorome TimeStamp to Date
									var date = new Date(doc.data().assignDate.seconds * 1000);
									temp = doc.data();
									temp['assignDateOfSurvey'] = date;
									temp['Sid'] = doc.id;
									pending_surveys.push(temp);
								}
							}
						});
						// console.log(user_surveys);
						//console.log(questions);
						//console.log(Object.keys(questions));
						//console.log(user_surveys);
						res.render('Visitor/visitor_past_surveys.ejs', {
							completed_surveys: completed_surveys,
							pending_surveys: pending_surveys,
							useremail: user.email,
							questions: questions
						});
						return;
					})
					.catch((err) => {
						console.log(err.message, ' No Survey Pressent - Past Surveys');
						res.redirect('/visitor_home');
						return;
					});
			})
			.catch((err) => {
				console.log(err.message, ' No Question Fetched - Past Surveys');
				res.redirect('/visitor_home');
				return;
			});
	} else {
		res.redirect('/visitor_signIn');
	}
});

// ----------------------- Visitor End -----------------------------------

// ------------------------ Guest / Student Routes -----------------------
// Get - Student login Page
app.get('/guest_signIn', (req, res) => {
	res.render('Guest/guest_signin.ejs');
});

// Post - Gues sign Page (login the guest)
app.post('/guest_signIn', (req, res) => {
	// sign in
	// console.log(req.body);
	if (firebase.auth().currentUser) {
		firebase.auth().signOut().then(() => {
			firebase.auth().signInWithEmailAndPassword(req.body.email, req.body.password).then(() => {
				res.redirect('/guest_home');
				return;
			});
		});
	} else {
		firebase
			.auth()
			.signInWithEmailAndPassword(req.body.email, req.body.password)
			.then(() => {
				res.redirect('/guest_home');
				return;
			})
			.catch((err) => {
				console.log(err.message, 'Guest UnAuth');
				res.redirect('/guest_signIn');
				return;
			});
	}
});

//After successful autentication of User

app.get('/guest_home', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		//console.log(user);
		Guests.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					collegesRef
						.get()
						.then((snapshot) => {
							let colleges = [];
							snapshot.forEach((college_data) => {
								let temp = college_data.data();
								temp.type = capitalize(temp.type);
								temp['id'] = college_data.id;
								colleges.push(temp);
							});
							//console.log('Hell Yeah');
							res.render('Guest/guest_home', {
								data: colleges,
								useremail: user.email
							});
							return;
						})
						.catch((err) => {
							console.log(err.message, 'No College Data Fetched - Guest Home');
							res.redirect('/guest_signIn');
							return;
						});
				} else {
					console.log('USERESD');
					res.redirect('/');
					return;
				}
			})
			.catch((err) => {
				console.log('BCIUUBWUW', err.message);
				res.redirect('/');
				return;
			});
	} else {
		console.log('JVODFE');
		res.redirect('/guest_signIn');
		return;
	}
});

app.get('/guest_profile', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		Guests.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					res.render('Guest/guest_profile', { user_data: doc.data(), user: user });
					return;
				} else {
					res.redirect('/visitor_signIn');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'Not a Guest - Guest Profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/visitor_signIn');
	}
});

// Visitor Update Profile
app.get('/updateProfile_guest', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		Guests.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					//console.log(doc.data());
					res.render('Guest/guest_update_profile.ejs', {
						user_data: doc.data(),
						user: user
					});
					return;
				} else {
					res.redirect('/guest_signIn');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'Not a Guest - Guest Update Profile (GET)');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/guest_signIn');
	}
});

// visitor profile update --- POST
// update the data in the firestore
app.post('/updateProfile_guest', (req, res) => {
	var updated_user_data = req.body;
	var user = firebase.auth().currentUser;

	Guests.doc(user.email)
		.update({
			// middlename: updated_user_data.middlename.toString(),
			// age: updated_user_data.age.toString(),
			number: updated_user_data.contactNumber.toString()
		})
		.then(function() {
			//console.log("Document successfully written!");
			res.redirect('/guest_profile');
			return;
		})
		.catch(function(error) {
			console.error('Error writing document: ', error);
			res.send(err);
			return;
		});
});

// Get - Guest signup Page
app.get('/guest_signUp', (req, res) => {
	res.render('Guest/guest_signup.ejs');
});

// Post - Guest signup Page (Register the Guest)
app.post('/guest_signUp', (req, res) => {
	var guest = {
		V_id: req.body.email,
		age: '',
		contactNumber: '',
		firstname: req.body.firstname,
		gmailID: req.body.email,
		isMailID_verified: false,
		isVerified: false,
		lastname: req.body.lastname,
		middlename: req.body.middlename,
		number: req.body.number
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
					number: req.body.number
				})
				.then(() => {
					console.log('Guest Created', guest);
					res.redirect('/guest_signIn');
				})
				.catch((e) => console.log(e));
		})
		.catch((err) => {
			console.log(err.message, 'Error in Creating Guest');
			res.redirect('/guest_signUp');
		});
});

// guest Logout
app.post('/guest_logout', (req, res) => {
	firebase
		.auth()
		.signOut()
		.then(() => {
			// Sign-out successful.
			res.redirect('/guest_signin');
		})
		.catch((err) => {
			console.log(err.message, 'Error in Logging Out - Guest Logout');
		});
});

// college Profile Page for guest
app.get('/college_Profile', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user && req.query.id !== '') {
		Guests.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					// send the college data
					collegesRef
						.doc(req.query.id)
						.get()
						.then((data) => {
							if (!data.exists) {
								res.redirect('/guest_home');
								return;
							} else {
								var collegeData = data.data();
								var collegeName = data.data().CollegeName;
								collegeData.type = capitalize(collegeData.type);
								// extract all the completed sureys
								let surveyData = [];
								surveysRef
									.get()
									.then((snapshot) => {
										snapshot.forEach((temp_survey) => {
											// extract all the completed sureys
											//console.log(collegeName);
											if (
												temp_survey.data().status == 'completed' &&
												temp_survey.data().collegeName == collegeName
											) {
												surveyData.push(temp_survey.data());
											}
										});
										//console.log(surveyData);
										res.render('Guest/guestcollegeDetails.ejs', {
											collegeData,
											surveyData
										});
										return;
									})
									.catch((err) => {
										console.log(err, 'Surveys Data not Fetched - Guest College Profile');
										res.redirect('/guest_home');
										return;
									});
							}
						})
						.catch((err) => {
							console.log(err, 'Colleges Data not Fetched - Guest College Profile');
							res.redirect('/guest_home');
							return;
						});
				} else {
					res.redirect('/guest_signin');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'NOt a Guest - Guest College Profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/guest_signin');
		return;
	}
});

// ------------------------ Guest / Student End -------------------------

// ---------------------- ADMIN routes -------------------------------
// get - admin login
app.get('/admin_login', (req, res) => {
	res.render('Admin/admin_login.ejs');
});

// post - admin login INCOMPLETE
app.post('/admin_login', (req, res) => {
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
app.get('/admin_logout', (req, res) => {
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

app.get('/admin_home', (req, res) => {
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
app.get('/visiting_Officer_list', (req, res) => {
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
app.get('/remove_officers', (req, res) => {
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
app.get('/removeOfficer/:id', (req, res) => {
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
app.get('/assign_new_survey', (req, res) => {
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
app.post('/assign_new_survey', (req, res) => {
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
app.get('/visitor_data', (req, res) => {
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
app.get('/show_Surveys', (req, res) => {
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
app.get('/survey_data', (req, res) => {
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
app.get('/add_college', (req, res) => {
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
app.post('/add_college', (req, res) => {
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
app.get('/survey_detail', (req, res) => {
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
app.get('/colleges', (req, res) => {
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
app.get('/college_detail', (req, res) => {
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
app.get('/getEmailVerified', (req, res) => {
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

app.listen(PORT, () => {
	console.log('Server started at localhost ', PORT);
});

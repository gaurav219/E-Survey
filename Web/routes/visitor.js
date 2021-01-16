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
const surveysRef = db.collection('surveys');

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

// Get - visitor login Page
router.get('/visitor_signIn', (req, res) => {
	res.render('Visitor/visitor_signin.ejs', { msg: '' });
});

router.post('/visitor_signIn', (req, res) => {
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
							//console.log('Created User');
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
});

// visitor Logout
router.post('/visitor_logout', (req, res) => {
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
router.get('/updateProfile_visitor', (req, res) => {
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
router.post('/updateProfile_visitor', (req, res) => {
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
router.get('/visitor_home', (req, res) => {
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
router.get('/visitor_Profile', (req, res) => {
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
router.get('/past_surveys', (req, res) => {
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

module.exports = router;

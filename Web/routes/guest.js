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
const surveysRef = db.collection('surveys');
const Guests = db.collection('Guests');

// survey questions - Global Variables
const collegesNames = [];

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
const capitalize = (s) => {
	if (typeof s !== 'string') return '';
	return s.charAt(0).toUpperCase() + s.slice(1);
};

// Get - Student login Page
router.get('/guest_signIn', (req, res) => {
	res.render('Guest/guest_signin.ejs');
});

// Post - Gues sign Page (login the guest)
router.post('/guest_signIn', (req, res) => {
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

router.get('/guest_home', (req, res) => {
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

router.get('/guest_profile', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user) {
		Guests.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					res.render('Guest/guest_profile', {
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
				console.log(err, 'Not a Guest - Guest Profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/visitor_signIn');
	}
});

// Visitor Update Profile
router.get('/updateProfile_guest', (req, res) => {
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
				res.redirect('/guest_signIn');
				return;
			});
	} else {
		res.redirect('/guest_signIn');
	}
});

// visitor profile update --- POST
// update the data in the firestore
router.post('/updateProfile_guest', (req, res) => {
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
			res.redirect('/guest_home');
			return;
		});
});

// Get - Guest signup Page
router.get('/guest_signUp', (req, res) => {
	res.render('Guest/guest_signup.ejs');
});

// Post - Guest signup Page (Register the Guest)
router.post('/guest_signUp', (req, res) => {
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
router.post('/guest_logout', (req, res) => {
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
router.get('/college_Profile', (req, res) => {
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

// college Profile Page for guest
router.get('/guest_search', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user && req.query.id !== '') {
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

							res.render('Guest/college_search.ejs', {
								data: colleges
							});
							return;
						})
						.catch((err) => {
							console.log(err.message, 'No College Data Fetched - Guest Home');
							res.redirect('/guest_signIn');
							return;
						});
				} else {
					res.redirect('/guest_signin');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'Not a Guest - Guest College Profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/guest_signin');
		return;
	}
});

//compare_colleges Page for guest
router.get('/compare_colleges', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user && req.query.id !== '') {
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

							res.render('Guest/compare_colleges.ejs', {
								data: colleges
							});
							return;
						})
						.catch((err) => {
							console.log(err.message, 'No College Data Fetched - Guest Home');
							res.redirect('/guest_signIn');
							return;
						});
				} else {
					res.redirect('/guest_signin');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'Not a Guest - Guest College Profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/guest_signin');
		return;
	}
});

// compare colleges Result Page for guest
router.post('/compare_result', (req, res) => {
	var user = firebase.auth().currentUser;
	if (user && req.query.id !== '') {
		Guests.doc(user.email)
			.get()
			.then((doc) => {
				if (doc.exists) {
					collegesRef
						.get()
						.then((snapshot) => {
							// variables to hold cllg data
							let collegeData1 = {};
							let collegeData2 = {};

							snapshot.forEach((college_data) => {
								let temp = college_data.data();
								if (temp.CollegeName.toLowerCase() === req.body.input_college_1.toLowerCase()) {
									temp.type = capitalize(temp.type);
									temp['id'] = college_data.id;
									collegeData1 = temp;
								}
								if (temp.CollegeName.toLowerCase() === req.body.input_college_2.toLowerCase()) {
									temp.type = capitalize(temp.type);
									temp['id'] = college_data.id;
									collegeData2 = temp;
								}
							});

							// avg cllg rating
							let cllg1_avg_rating = [ 0, 0 ];
							let cllg2_avg_rating = [ 0, 0 ];

							// variable to store total number of surveys count

							let cllg1_total_surveys_count = 0;
							let cllg2_total_surveys_count = 0;

							// variable to store min and max rating value
							let cllg1_min_rating = [ 10, 10 ];
							let cllg2_min_rating = [ 10, 10 ];
							let cllg1_max_rating = [ 0, 0 ];
							let cllg2_max_rating = [ 0, 0 ];

							//console.log(req.body);
							surveysRef
								.get()
								.then((snapshot) => {
									snapshot.forEach((temp_survey) => {
										// extract survey ratings --- for avg rating
										if (
											temp_survey.data().status == 'completed' &&
											temp_survey.data().collegeName.toLowerCase() ==
												req.body.input_college_1.toLowerCase()
										) {
											cllg1_avg_rating[0] += temp_survey.data().scoreOfTeaching[0];
											cllg1_avg_rating[1] += temp_survey.data().scoreOfTeaching[1];
											cllg1_total_surveys_count++;

											// update min rating
											if (cllg1_min_rating[0] > temp_survey.data().scoreOfTeaching[0]) {
												cllg1_min_rating[0] = temp_survey.data().scoreOfTeaching[0];
											}
											if (cllg1_min_rating[1] > temp_survey.data().scoreOfTeaching[1]) {
												cllg1_min_rating[1] = temp_survey.data().scoreOfTeaching[1];
											}
											// update max rating
											if (cllg1_max_rating[0] < temp_survey.data().scoreOfTeaching[0]) {
												cllg1_max_rating[0] = temp_survey.data().scoreOfTeaching[0];
											}
											if (cllg1_max_rating[1] < temp_survey.data().scoreOfTeaching[1]) {
												cllg1_max_rating[1] = temp_survey.data().scoreOfTeaching[1];
											}
										} else if (
											temp_survey.data().status == 'completed' &&
											temp_survey.data().collegeName.toLowerCase() ==
												req.body.input_college_2.toLowerCase()
										) {
											cllg2_avg_rating[0] += temp_survey.data().scoreOfTeaching[0];
											cllg2_avg_rating[1] += temp_survey.data().scoreOfTeaching[1];
											cllg2_total_surveys_count++;

											// update min rating
											if (cllg2_min_rating[0] > temp_survey.data().scoreOfTeaching[0]) {
												cllg2_min_rating[0] = temp_survey.data().scoreOfTeaching[0];
											}
											if (cllg2_min_rating[1] > temp_survey.data().scoreOfTeaching[1]) {
												cllg2_min_rating[1] = temp_survey.data().scoreOfTeaching[1];
											}
											// update max rating
											if (cllg2_max_rating[0] < temp_survey.data().scoreOfTeaching[0]) {
												cllg2_max_rating[0] = temp_survey.data().scoreOfTeaching[0];
											}
											if (cllg2_max_rating[1] < temp_survey.data().scoreOfTeaching[1]) {
												cllg2_max_rating[1] = temp_survey.data().scoreOfTeaching[1];
											}
										}
									});

									// console.log(cllg1_avg_rating);
									// console.log(cllg2_avg_rating);
									// console.log(cllg1_total_surveys_count);
									// console.log(cllg2_total_surveys_count);

									// calculate the avg rating
									collegeData1['avg_rating'] = cllg1_avg_rating.map(
										(rating) =>
											Math.round((rating / cllg1_total_surveys_count + Number.EPSILON) * 100) /
											100
									);
									collegeData2['avg_rating'] = cllg2_avg_rating.map(
										(rating) =>
											Math.round((rating / cllg2_total_surveys_count + Number.EPSILON) * 100) /
											100
									);

									// storing min and max rating values
									collegeData1['max_rating'] = cllg1_max_rating;
									collegeData2['max_rating'] = cllg2_max_rating;
									collegeData1['min_rating'] = cllg1_min_rating;
									collegeData2['min_rating'] = cllg2_min_rating;

									//total survey counts
									collegeData1['totalSurveys'] = cllg1_total_surveys_count;
									collegeData2['totalSurveys'] = cllg2_total_surveys_count;

									console.log(collegeData1);
									console.log(collegeData2);

									res.render('Guest/compare_result.ejs', {
										data: { collegeData1, collegeData2 }
									});
									return;
								})
								.catch((err) => {
									console.log(err, 'Surveys Data not Fetched - Guest College Profile');
									res.redirect('/guest_home');
									return;
								});
						})
						.catch((err) => {
							console.log(err.message, 'No College Data Fetched - Guest Home');
							res.redirect('/guest_signIn');
							return;
						});
				} else {
					res.redirect('/guest_signin');
					return;
				}
			})
			.catch((err) => {
				console.log(err, 'Not a Guest - Guest College Profile');
				res.redirect('/');
				return;
			});
	} else {
		res.redirect('/guest_signin');
		return;
	}
});

module.exports = router;

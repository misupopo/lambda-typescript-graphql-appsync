// jwt tokenを発行する
const AWS_REGION = config.region;
const COGNITO_USER_POOL_ID = config.userPoolClientId;
const CLIENT_ID = config.clientId;

var regDialog, regForm;
var verifyDialog;
var regCompleteDialog;
var signInDialog;
var userPool, cognitoUser;
var idToken;

function toggleSignOut ( enable ) {
    enable === true ? $( '#sign-out' ).show() : $( '#sign-out' ).hide();
}
function toggleSignIn ( enable ) {
    enable === true ? $( '#sign-in' ).show() : $( '#sign-in' ).hide();
}
function toggleRegister ( enable ) {
    enable === true ? $( '#register' ).show() : $( '#register' ).hide();
}
function init() {
    AWS.config.region = AWS_REGION;
    AWSCognito.config.region = AWS_REGION;
    var data = {
        UserPoolId : COGNITO_USER_POOL_ID,
        ClientId : CLIENT_ID
    };
    userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool( data );
    cognitoUser = userPool.getCurrentUser();
    if ( cognitoUser != null ) {
        cognitoUser.getSession( function( err, session ) {
        if ( err ) {
            alert( err );
            return;
        }
        idToken = session.idToken.jwtToken;
        console.log( 'idToken: ' + idToken );
        console.log( 'session validity: ' + session.isValid() );
        } );
        toggleSignOut( true );
        toggleSignIn( false );
        toggleRegister( false );
    } else {
        toggleSignOut( false );
        toggleSignIn( true );
        toggleRegister( true );
    }
}
function addUser() {
    var firstName = $( "#first-name" )[0].value;
    var lastName = $( "#last-name" )[0].value;
    var username = $( "#username" )[0].value;
    var password = $( "#password" )[0].value;
    var email = $( "#email" )[0].value;
    var attributeList = [
        new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute( {
            Name : 'email', Value : email
        } ),
        // given_nameという属性はおそらく今はnameという属性に変わっている
        new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute( {
            Name : 'name', Value : firstName
        } ),
        new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute( {
            Name : 'family_name', Value : lastName
        } ),
    ];
    userPool.signUp( username, password, attributeList, null, function( err, result ){
        if ( err ) {
            alert( err );
            return;
        }
        cognitoUser = result.user;
        console.log( 'user name is ' + cognitoUser.getUsername() );
        regDialog.dialog( "close" );
        verifyDialog.dialog( "open" );
    } );
}
function confirmUser() {
    var verificationCode = $( "#verification-code" )[0].value;
    cognitoUser.confirmRegistration( verificationCode, true, function( err, result ) {
        if ( err ) {
            alert( err );
            return;
        }
        console.log( 'verification call result: ' + result );
        verifyDialog.dialog( "close" );
        regCompleteDialog.dialog( "open" );
    } );
}
function authenticateUser() {
    var username = $( "#sign-in-username" )[0].value;
    var password = $( "#sign-in-password" )[0].value;
    var authenticationData = {
        Username : username,
        Password : password,
    };
    var authenticationDetails = new AWSCognito
        .CognitoIdentityServiceProvider.AuthenticationDetails( authenticationData );
    var userData = {
        Username : username,
        Pool : userPool
    };
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser( userData );
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('access token : ' + result.getAccessToken().getJwtToken());
            idToken = result.idToken.jwtToken;
            console.log('idToken : ' + idToken);
            signInDialog.dialog("close");
            toggleRegister(false);
            toggleSignIn(false);
            toggleSignOut(true);
        },
        onFailure: function (err) {
            alert(err);
        },
        newPasswordRequired: function(userAttributes, requiredAttributes) {
            console.log(userAttributes, requiredAttributes);
        }
    });
}
function signOut() {
    if ( cognitoUser != null ) {
        cognitoUser.signOut();
        toggleRegister( true );
        toggleSignIn( true );
        toggleSignOut( false );
    }
}
$( document ).ready( function() {

    regDialog = $( "#reg-dialog-form" ).dialog( {
        autoOpen: false,
        modal: true,
        buttons: {
        "Create an account": addUser,
        Cancel: function() {
            regDialog.dialog( "close" );
        }
        },
        close: function() {
        regForm[0].reset();
        }
    } );
    regForm = regDialog.find( "form" ).on( "submit", function( event ) {
        event.preventDefault();
        addUser();
    } );

    $( "#register" ).on( "click", function() {
        regDialog.dialog( "open" );
    } );
    verifyDialog = $( "#verify-dialog-form" ).dialog( {
        autoOpen: false,
        modal: true,
        buttons: {
        "Confirm registration": confirmUser,
        Cancel: function() {
            verifyDialog.dialog( "close" );
        }
        },
        close: function() {
        $( this ).dialog( "close" );
        }
    } );
    regCompleteDialog = $( "#registered-message" ).dialog( {
        autoOpen: false,
        modal: true,
        buttons: {
        Ok: function() {
            $( this ).dialog( "close" );
        }
        }
    } );
    signInDialog = $( "#sign-in-form" ).dialog( {
        autoOpen: false,
        modal: true,
        buttons: {
            "Sign in": authenticateUser,
            Cancel: function() {
                signInDialog.dialog( "close" );
            }
        },
        close: function() {
            $( this ).dialog( "close" );
        }
    } );
    $( "#sign-in" ).on( "click", function() {
        signInDialog.dialog( "open" );
    } );
    $( "#sign-out" ).on( "click", function() {
        signOut();
    } )
    init();
} );

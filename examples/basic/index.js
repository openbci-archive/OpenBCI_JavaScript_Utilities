
const onConnectClick = async () => {
    const OpenBCIUtilties = new OpenBCIUtilities();
    console.log(OpenBCIUtilties.Constants.isString("taco"));
};

document.getElementById('connect')
    .addEventListener('click', onConnectClick);
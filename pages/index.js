import { faker } from '@faker-js/faker/locale/en_IN';
import AudioCall from '@/components/fullPageComps/AudioCall';
import styles from '@/styles/Home.module.css'

const MainPage = ({ userDetails }) => {
  return (
    <div>
      <AudioCall userDetails={userDetails} />
      <div className={styles.messageBox}>
        <p>
          Sir, currently all buttons are just for show. Only the <span style={{color:'yellow'}}>Find new button</span>  is working.
        </p>
        <br />
        <p>Please help me make smooth audio calls</p>
      </div>
    </div>
  );
};

const getRandomDetails = () => {
  const genders = ['male', 'female'];

  // Generate a random unique email using faker
  const email = faker.internet.email();

  // Choose a random gender
  const gender = genders[Math.floor(Math.random() * genders.length)];

  // Set college as 'XYZ'
  const college = 'XYZ';

  // Set isVerified to true
  const isVerified = true;

  // Create random user details
  const userDetails = {
    email,
    gender,
    college,
    isVerified,
  };

  return userDetails;
};

export async function getServerSideProps() {
  let userDetails = getRandomDetails();

  return {
    props: {
      userDetails,
    },
  };
}

export default MainPage;

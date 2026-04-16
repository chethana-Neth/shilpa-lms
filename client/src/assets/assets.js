import icon from './icon.svg'
import search_icon from './search_icon.svg'
import star from './rating_star.svg'
import star_blank from './star_dull_icon.svg'
import arrow_icon from './arrow_icon.svg'
import cross_icon from './cross_icon.svg'
import down_arrow_icon from './down_arrow_icon.svg'
import play_icon from './play_icon.svg'
import time_left_clock_icon from './time_left_clock_icon.svg'
import time_clock_icon from './time_clock_icon.svg'
import lesson_icon from './lesson_icon.svg'
import blue_tick_icon from './blue_tick_icon.svg'
import home_icon from './home_icon.svg'
import my_course_icon from './my_course_icon.svg'
import person_tick_icon from './person_tick_icon.svg'
import add_icon from './add_icon.svg'
import grade6Img from './Grade6.png'
import grade7Img from './Grade7.png'
import grade8Img from './Grade8.png'
import grade9Img from './Grade9.png'
import grade10Img from './Grade10.png'
import grade11Img from './Grade11.png'
import profile_img1 from  './profile_img1.png'

export const assets = {
    icon,
    search_icon,
    star,
    star_blank,
    arrow_icon,
    cross_icon,
    down_arrow_icon,
    play_icon,
    time_left_clock_icon,
    time_clock_icon,
    lesson_icon,
    blue_tick_icon,
    home_icon,
    my_course_icon,
    person_tick_icon,
    add_icon,
    grade6Img,
    grade7Img,
    grade8Img,
    grade9Img,
    grade10Img,
    grade11Img,
    profile_img1


}



export const dummyEducatorData = {
    "_id": "675ac1512100b91a6d9b8b24",
    "name": "Chethana",
    "email": "user.chethananethmini3@gmail.com",
    "imageUrl": "",
    "createdAt": "2025-12-12T10:56:17.930Z",
    "updatedAt": "2025-12-12T10:56:17.930Z",
    "__v": 0
}

export const dummyTestimonial = [
    {
        name: 'Chethana Nethmini',
        
        image: assets.profile_img1,
        rating: 5,
        feedback: 'I\'ve been using Imagify for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.',
    },
    {
        name: 'Dilnath Dulmika',
       
        image: assets.profile_img1,
        rating: 4,
        feedback: 'I\'ve been using Imagify for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.',
    },
    {
        name: 'Isuru Sahan',
        
        image: assets.profile_img1,
        rating: 4.5,
        feedback: 'I\'ve been using Imagify for nearly two years, primarily for Instagram, and it has been incredibly user-friendly, making my work much easier.',
    },
];

export const dummyDashboardData = {
    "totalEarnings": 707.38,
    "enrolledStudentsData": [
        {
            "courseTitle": "Grade 6 Information and Communication Technology",
            "student": {
                "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
                "name": "Chethana",
                "imageUrl": ""
            }
        },
        {
            "courseTitle": "Grade 7 Information and Communication Technology",
            "student": {
                "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
                "name": "Chethana",
                "imageUrl": ""
            }
        },
        {
            "courseTitle": "Grade 8 Information and Communication Technology",
            "student": {
                "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
                "name": "Chethana",
                "imageUrl": ""
            }
        },
        {
            "courseTitle": "Grade 9 Information and Communication Technology",
            "student": {
                "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
                "name": "Chethana",
                "imageUrl": ""
            }
        },
        {
            "courseTitle": "Grade 10 Information and Communication Technology",
            "student": {
                "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
                "name": "Chethana",
                "imageUrl": ""
            }
        }
    ],
    "totalCourses": 8
}

export const dummyStudentEnrolled = [
    {
        "student": {
            "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            
            "imageUrl": ""
        },
        "courseTitle": "Grade 6 Information and Communication Technology",
        "purchaseDate": "2025-12-20T08:39:55.509Z"
    },
    {
        "student": {
            "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            
            "imageUrl": ""
        },
        "courseTitle": "Grade 6 Information and Communication Technology",
        "purchaseDate": "2025-12-20T08:59:49.964Z"
    },
    {
        "student": {
            "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
           
            "imageUrl": ""
        },
        "courseTitle": "Grade 7 Information and Communication Technology",
        "purchaseDate": "2025-12-20T11:03:42.931Z"
    },
    {
        "student": {
            "_id": "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            
            "imageUrl": ""
        },
        "courseTitle": "Grade 8 Information and Communication Technology",
        "purchaseDate": "2025-12-20T11:04:48.798Z"
    }
]



export const dummyCourses = [
    {
        "_id": "605c72efb3f1c2b1f8e4e1a1",
        "courseTitle": "Grade 6 Information and Communication Technology",
        "courseDescription": "<h2>Information and communication Technology</h2><p>This helps them build a strong foundation and develop confidence in using digital devices for learning and daily activities.</p><p>This course introduces students to the basic concepts of ICT. Students will learn about computer parts, basic software, and safe use of technology in everyday life.</P><ul><li>Understand basic computer functions</li><li>Identify input and output devices</li><li>Learn safe and responsible ICT usage</li></ul>",
        "coursePrice": 18000,
        "isPublished": true,
        "discount": 20,
        "courseContent": [
            {
                "chapterId": "chapter1",
                "chapterOrder": 1,
                "chapterTitle": "Importance of Computers",
                "chapterContent": [
                    {
                        "lectureId": "lecture1",
                        "lectureTitle": "Functions of a Computer",
                        "lectureDuration": 16,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture2",
                        "lectureTitle": "Significant features of a computer",
                        "lectureDuration": 19,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            },
            {
                "chapterId": "chapter2",
                "chapterOrder": 2,
                "chapterTitle": "Use the computer laboratory safely",
                "chapterContent": [
                    {
                        "lectureId": "lecture3",
                        "lectureTitle": "Lets identify computer laboratory",
                        "lectureDuration": 20,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture4",
                        "lectureTitle": "Lets use the computer laboratory correctly",
                        "lectureDuration": 10,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            }
        ],
        "educator": "675ac1512100b91a6d9b8b24",
        "enrolledStudents": [
            "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            "user_2qjlgkAqIMpiR2flWIRzvWKtE0w"
        ],
        "courseRatings": [
            {
                "userId": "user_2qjlgkAqIMpiR2flWIRzvWKtE0w",
                "rating": 5,
                "_id": "6773e37360cb0ab974342314"
            }
        ],
        "createdAt": "2025-12-17T08:16:53.622Z",
        "updatedAt": "2026-01-02T04:47:44.701Z",
        "__v": 4,
        "courseThumbnail": grade6Img
    },
    {
        "_id": "675ac1512100b91a6d9b8b24",
        "courseTitle": "Grade 7 Information and Communication Technology",
        "courseDescription": "<h2>Information and Communication Technology</h2><p>This helps students improve their practical skills and understand how technology is used for communication and information sharing.</p><p>This course helps students explore more about ICT tools and the internet. It focuses on developing digital skills for school and personal use.</p><ul><li>Learn file management techniques</li><li>Understand internet usage and email</li><li>Use basic application software effectively</li></ul>",
        "coursePrice": 18000,
        "isPublished": true,
        "discount": 15,
        "courseContent": [
            {
                "chapterId": "chapter1",
                "chapterOrder": 1,
                "chapterTitle": "Central Processing Unit",
                "chapterContent": [
                    {
                        "lectureId": " lecture1",
                        "lectureTitle": "Lets identify the Central Processing Unit",
                        "lectureDuration": 720,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture2",
                        "lectureTitle": "Lets identify the components of the central processing Unit",
                        "lectureDuration": 850,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            },
            {
                "chapterId": "chapter2",
                "chapterOrder": 2,
                "chapterTitle": "Operating System",
                "chapterContent": [
                    {
                        "lectureId": "lecture3",
                        "lectureTitle": "Lets learn about the operating system",
                        "lectureDuration": 900,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture4",
                        "lectureTitle": "Different types of Operating System",
                        "lectureDuration": 950,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            }
        ],
        "educator": "675ac1512100b91a6d9b8b24",
        "enrolledStudents": [
            "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            "user_2qjlgkAqIMpiR2flWIRzvWKtE0w"
        ],
        "courseRatings": [
            {
                "userId": "user_2qjlgkAqIMpiR2flWIRzvWKtE0w",
                "rating": 5,
                "_id": "6776369244daad0f313d81a9"
            }
        ],
        "createdAt": "2025-12-17T08:16:53.622Z",
        "updatedAt": "2026-01-02T06:47:54.446Z",
        "__v": 3,
        "courseThumbnail": grade7Img
    },
    {
        "_id": "605c72efb3f1c2b1f8e4e1ae",
        "courseTitle": " Grade 8 Information and Communication Technology ",
        "courseDescription": "<h2>Protect Systems and Networks</h2><p>Cybersecurity is critical in today's digital age. This course introduces the fundamentals of cybersecurity, including threat analysis, ethical hacking, and secure programming practices.</p><p>By the end of this course, you will understand how to identify vulnerabilities and implement security measures effectively.</p><ul><li>Understand security protocols</li><li>Learn about encryption techniques</li><li>Conduct basic penetration testing</li></ul>",
        "coursePrice": 18000,
        "isPublished": true,
        "discount": 15,
        "courseContent": [
            {
                "chapterId": "chapter1",
                "chapterOrder": 1,
                "chapterTitle": "Number Systems",
                "chapterContent": [
                    {
                        "lectureId": "lecture1",
                        "lectureTitle": "Use of number systems",
                        "lectureDuration": 10,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture2",
                        "lectureTitle": "Types of number systems",
                        "lectureDuration": 18,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            },
            {
                "chapterId": "chapter2",
                "chapterOrder": 2,
                "chapterTitle": "Configuring and formatting a computer",
                "chapterContent": [
                    {
                        "lectureId": "lecture3",
                        "lectureTitle": "Formatting date, time zone, currency and numbers",
                        "lectureDuration": 15,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture4",
                        "lectureTitle": "File attributes",
                        "lectureDuration": 20,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            }
        ],
        "educator": "675ac1512100b91a6d9b8b24",
        "enrolledStudents": [
            "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            "user_2qjlgkAqIMpiR2flWIRzvWKtE0w"
        ],
        "courseRatings": [],
        "createdAt": "2025-12-27T11:30:00.000Z",
        "updatedAt": "2025-12-31T04:14:49.773Z",
        "__v": 2,
        "courseThumbnail": grade8Img
    },
    {
        "_id": "605c72efb3f1c2b1f8e4e1a7",
        "courseTitle": "Grade 9 Information and Communication Technology",
        "courseDescription": "<h2>Become a Full-Stack Web Developer</h2><p>This comprehensive bootcamp covers everything you need to know to become a full-stack web developer. From HTML and CSS to JavaScript and backend technologies, this course is designed to take you from beginner to job-ready.</p><p>Throughout the course, you will work on real-world projects, build a portfolio, and gain the skills necessary to succeed in the tech industry.</p><ul><li>Learn front-end and back-end development</li><li>Build responsive and dynamic web applications</li><li>Understand databases and server-side programming</li></ul>",
        "coursePrice": 18000,
        "isPublished": true,
        "discount": 25,
        "courseContent": [
            {
                "chapterId": "chapter1",
                "chapterOrder": 1,
                "chapterTitle": "Preparation of Computer Specifications",
                "chapterContent": [
                    {
                        "lectureId": "lecture1",
                        "lectureTitle": "Identifying the user",
                        "lectureDuration": 600,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture2",
                        "lectureTitle": "Selection of a computer to suit user requirements",
                        "lectureDuration": 720,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            },
            {
                "chapterId": "chapter2",
                "chapterOrder": 2,
                "chapterTitle": "Electronic Spreadsheets",
                "chapterContent": [
                    {
                        "lectureId": "lecture3",
                        "lectureTitle": "What are spreadsheets",
                        "lectureDuration": 800,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture4",
                        "lectureTitle": "Spreadsheet features",
                        "lectureDuration": 850,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            }
        ],
        "educator": "675ac1512100b91a6d9b8b24",
        "enrolledStudents": [
            "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            "user_2qjlgkAqIMpiR2flWIRzvWKtE0w"
        ],
        "courseRatings": [],
        "createdAt": "2025-12-17T08:16:53.622Z",
        "updatedAt": "2025-12-31T05:31:27.290Z",
        "__v": 2,
        "courseThumbnail": grade9Img
    },
    {
        "_id": "605c72efb3f1c2b1f8e4e1ac",
        "courseTitle": "Grade 10 Information and Communication Technology",
        "courseDescription": "<h2>Master Cloud Fundamentals</h2><p>Learn the foundations of cloud computing and explore popular cloud platforms like AWS, Azure, and Google Cloud. This course is ideal for IT professionals and developers looking to transition to cloud-based solutions.</p><p>By the end of this course, you will understand cloud services, deployment models, and best practices for using cloud resources efficiently.</p><ul><li>Understand cloud architecture</li><li>Learn to work with AWS, Azure, and GCP</li><li>Explore serverless computing and storage solutions</li></ul>",
        "coursePrice": 18000,
        "isPublished": true,
        "discount": 20,
        "courseContent": [
            {
                "chapterId": "chapter1",
                "chapterOrder": 1,
                "chapterTitle": "Information and Communication Technology",
                "chapterContent": [
                    {
                        "lectureId": "lecture1",
                        "lectureTitle": "Data and Information",
                        "lectureDuration": 600,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture2",
                        "lectureTitle": "Information System",
                        "lectureDuration": 720,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            },
            {
                "chapterId": "chapter2",
                "chapterOrder": 2,
                "chapterTitle": "Fundamentals of a computer system",
                "chapterContent": [
                    {
                        "lectureId": "lecture3",
                        "lectureTitle": "What is a computer?",
                        "lectureDuration": 800,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture4",
                        "lectureTitle": "Classification of computers",
                        "lectureDuration": 850,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            }
        ],
        "educator": "675ac1512100b91a6d9b8b24",
        "enrolledStudents": [
            "user_2qjlgkAqIMpiR2flWIRzvWKtE0w"
        ],
        "courseRatings": [],
        "createdAt": "2025-12-17T08:16:53.622Z",
        "updatedAt": "2025-12-31T05:32:55.357Z",
        "__v": 1,
        "courseThumbnail": grade10Img
    },
    {
        "_id": "605c72efb3f1c2b1f8e4e1ad",
        "courseTitle": "Grade 11 Information and Communication Technology",
        "courseDescription": "<h2>Start Your Data Science Journey</h2><p>Data Science is one of the most in-demand fields in the world. This course teaches you the essentials of data analysis, visualization, and machine learning using Python. Learn libraries like Pandas, NumPy, Matplotlib, and Scikit-learn.</p><p>By the end of this course, you will be equipped to work on real-world data projects and gain insights from data.</p><ul><li>Data cleaning and preprocessing</li><li>Exploratory Data Analysis (EDA)</li><li>Build predictive models</li></ul>",
        "coursePrice": 18000,
        "isPublished": true,
        "discount": 20,
        "courseContent": [
            {
                "chapterId": "chapter1",
                "chapterOrder": 1,
                "chapterTitle": "Programming",
                "chapterContent": [
                    {
                        "lectureId": "lecture1",
                        "lectureTitle": "Analyzing a problem",
                        "lectureDuration": 30,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture2",
                        "lectureTitle": "Problem Solving using Algorithms",
                        "lectureDuration": 25,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            },
            {
                "chapterId": "chapter2",
                "chapterOrder": 2,
                "chapterTitle": "System Development Life Cycle",
                "chapterContent": [
                    {
                        "lectureId": "lecture3",
                        "lectureTitle": "What is a system?",
                        "lectureDuration": 20,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": true,
                        "lectureOrder": 1
                    },
                    {
                        "lectureId": "lecture4",
                        "lectureTitle": "Basic elements of a system",
                        "lectureDuration": 25,
                        "lectureUrl": "https://youtu.be/_Nx8vFJIphU",
                        "isPreviewFree": false,
                        "lectureOrder": 2
                    }
                ]
            }
        ],
        "educator": "675ac1512100b91a6d9b8b24",
        "enrolledStudents": [
            "user_2qjlgkAqIMpiR2flWIRzvWKtE0w",
            "user_2qQlvXyr02B4Bq6hT0Gvaa5fT9V",
            "user_2qjlgkAqIMpiR2flWIRzvWKtE0w"
        ],
        "courseRatings": [
            {
                "userId": "user_2qjlgkAqIMpiR2flWIRzvWKtE0w",
                "rating": 5,
                "_id": "6773acf160cb0ab974342248"
            }
        ],
        "createdAt": "2025-12-27T10:00:00.000Z",
        "updatedAt": "2025-12-31T09:57:48.992Z",
        "__v": 3,
        "courseThumbnail": grade11Img
    },
   
  
]




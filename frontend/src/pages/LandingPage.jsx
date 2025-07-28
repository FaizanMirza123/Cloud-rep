import React, { useState } from "react";
import { Link } from "react-router-dom";

// Import Bootstrap CSS directly into this component
import "bootstrap/dist/css/bootstrap.min.css";

// Import React-Bootstrap components
import {
  Navbar,
  Nav,
  Button,
  Container,
  Row,
  Col,
  Accordion,
  Form,
  Modal,
  Alert,
} from "react-bootstrap";

// Import React-Bootstrap-Icons
import {
  Cpu,
  MicFill,
  ChatDotsFill,
  GraphUpArrow,
  Headset,
  PersonRolodex,
  CalendarCheck,
  Funnel,
  CardChecklist,
  PersonLinesFill,
  CreditCard,
} from "react-bootstrap-icons";

// This component holds all of your custom CSS.
const Styles = () => (
  <style>{`
    body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        background-color: #f8f9fa;
    }
    .navbar-brand .brand-text {
        font-weight: bold;
        color: #0d6efd !important;
    }
    .hero-section {
        padding: 100px 0;
        text-align: center;
        background-color: #fff;
    }
    .hero-section h1 {
        font-size: 3.5rem;
        font-weight: 700;
    }
    .hero-section .ai-powered {
        color: #0d6efd;
    }
    .hero-section .btn {
        padding: 12px 30px;
        font-size: 1.1rem;
    }
    .section-padding {
        padding: 80px 0;
    }
    .section-title {
        font-weight: 700;
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }
    .section-title .highlight {
        color: #0d6efd;
    }
    .feature-icon {
        font-size: 2rem;
        color: #0d6efd;
    }
    .live-demo-form {
        background-color: #1a2035;
        color: white;
        padding: 2.5rem;
        border-radius: 1rem;
    }
    
    .agent-type-card {
        background-color: #fff;
        border: 1px solid #dee2e6;
        border-radius: 0.75rem;
        padding: 1.5rem;
        font-weight: 500;
        transition: all 0.25s ease-in-out;
        text-decoration: none;
        color: #343a40;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        cursor: pointer;
    }

    /* --- CSS FIX IS HERE --- */
    /* This rule now ONLY applies on hover, not to an ".active" class */
    .agent-type-card:hover {
        border-color: #0d6efd;
        color: #0d6efd;
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    /* --- END OF CSS FIX --- */

    .agent-type-card .icon {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
    }

    .stat-number {
        font-size: 4rem;
        font-weight: 700;
        color: #0d6efd;
    }
    .faq-accordion .accordion-button:not(.collapsed) {
        background-color: #e7f1ff;
        color: #0c63e4;
        box-shadow: none;
    }
    .footer {
        background-color: #1a2035;
        color: #adb5bd;
        padding-top: 5rem;
        padding-bottom: 2rem;
    }
    .footer h5 {
        color: #fff;
        margin-bottom: 1rem;
    }
    .footer a {
        color: #adb5bd;
        text-decoration: none;
        transition: color 0.2s;
    }
    .footer a:hover {
        color: #fff;
    }
    .footer .list-unstyled li {
        margin-bottom: 0.5rem;
    }

    /* --- Sliding Logo Animation --- */
    .logo-slider {
        overflow: hidden;
        padding: 20px 0;
        white-space: nowrap;
        position: relative;
    }
    .logo-slider:before,
    .logo-slider:after {
        position: absolute;
        top: 0;
        width: 150px;
        height: 100%;
        content: "";
        z-index: 2;
    }
    .logo-slider:before {
        left: 0;
        background: linear-gradient(to left, rgba(248,249,250,0), #f8f9fa);
    }
    .logo-slider:after {
        right: 0;
        background: linear-gradient(to right, rgba(248,249,250,0), #f8f9fa);
    }
    @keyframes slide {
        from { transform: translateX(0); }
        to { transform: translateX(-100%); }
    }
    
    .logos-slide {
        display: flex;
        align-items: center;
        animation: 25s slide infinite linear;
    }

    .logos-slide img {
        height: 30px;
        margin: 0 40px;
        filter: grayscale(100%);
        opacity: 0.6;
        transition: opacity 0.2s;
    }
    .logos-slide img:hover {
        opacity: 1;
        filter: grayscale(0%);
    }
  `}</style>
);

const LandingPage = () => {
  // State for Schedule Demo Modal
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoFormData, setDemoFormData] = useState({
    Email: "",
    FirstName: "",
    LastName: "",
    Appointment_Date: "",
    Appointment_Time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Handle demo form input changes
  const handleDemoFormChange = (e) => {
    const { name, value } = e.target;
    setDemoFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle demo form submission
  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    try {
      // Format the data according to specifications
      const formattedData = {
        Email: demoFormData.Email,
        FirstName: demoFormData.FirstName,
        LastName: demoFormData.LastName,
        Appointment_Date: demoFormData.Appointment_Date, // Already in YYYY-MM-DD format
        Appointment_Time: `T${demoFormData.Appointment_Time}:00.000Z`, // Convert HH:MM to THH:MM:SS.000Z
        Preferred_Contact_Method: "Email",
      };

      const response = await fetch(
        "https://hook.us2.make.com/0a8zjatgf1xadpf02xl068u6uecak6o5",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedData),
        }
      );

      if (response.ok) {
        setSubmitMessage(
          "Demo scheduled successfully! We will contact you soon."
        );
        setDemoFormData({
          Email: "",
          FirstName: "",
          LastName: "",
          Appointment_Date: "",
          Appointment_Time: "",
        });
        setTimeout(() => {
          setShowDemoModal(false);
          setSubmitMessage("");
        }, 2000);
      } else {
        throw new Error("Failed to schedule demo");
      }
    } catch (error) {
      setSubmitError("Failed to schedule demo. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open demo modal
  const openDemoModal = () => {
    setShowDemoModal(true);
    setSubmitError("");
    setSubmitMessage("");
  };

  const agentTypes = [
    { icon: PersonRolodex, name: "Receptionist" },
    { icon: CalendarCheck, name: "Appointment Setter" },
    { icon: Funnel, name: "Lead Qualification" },
    { icon: CardChecklist, name: "Survey" },
    { icon: PersonLinesFill, name: "Customer Service" },
    { icon: CreditCard, name: "Debt Collection" },
  ];

  const faqData = [
    {
      eventKey: "0",
      title: "What is EmployAI?",
      body: "EmployAI is an all-in-one AI-powered communication platform that automates inbound and outbound customer interactions, including bookings, inquiries, lead generation, and customer support.",
    },
    {
      eventKey: "1",
      title: "Is EmployAI suitable for my industry?",
      body: "Yes, EmployAI offers tailored solutions for a wide range of industries including Healthcare, Legal Services, Government, and more. Our platform is flexible and can be customized to meet your specific business needs.",
    },
    {
      eventKey: "2",
      title: "How Secure is EmployAI?",
      body: "We prioritize data security and privacy. EmployAI is built with robust security measures, including end-to-end encryption and compliance with industry standards, to ensure your data is always protected.",
    },
    {
      eventKey: "3",
      title: "Can I customize EmployAI for my business?",
      body: "Absolutely. Customization is at the core of our platform. You can create custom AI agents, define specific workflows, integrate with your existing CRM, and tailor the entire experience to match your brand and operational needs.",
    },
  ];

  const partnerLogos = [
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png",
      alt: "OpenAI",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/1280px-Amazon_Web_Services_Logo.svg.png",
      alt: "AWS",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Microsoft_Azure_Logo.svg/1280px-Microsoft_Azure_Logo.svg.png",
      alt: "Azure",
    },
    {
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Twilio-logo-red.svg/1280px-Twilio-logo-red.svg.png",
      alt: "Twilio",
    },
  ];

  const duplicatedLogos = [...partnerLogos, ...partnerLogos];

  return (
    <>
      <Styles />

      {/* Navbar */}
      <Navbar bg="white" expand="lg" className="sticky-top shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <Cpu className="me-2" color="#0d6efd" size={24} />
            <span className="brand-text">EmployAI</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="mx-auto">
              <Nav.Link href="#solutions">Solutions</Nav.Link>
              <Nav.Link href="#platform">Platform</Nav.Link>
              <Nav.Link href="#company">Company</Nav.Link>
            </Nav>
            <Button as={Link} to="/register" variant="primary">
              Get Started
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <Container>
            <Row className="justify-content-center">
              <Col lg={10}>
                <p className="text-primary fw-bold">
                  EmployAI Agents Business Automation
                </p>
                <h1 className="mb-4">
                  Say Hello to Your Fully Automated <br />
                  <span className="ai-powered">AI-Powered Workforce</span>
                </h1>
                <p className="lead text-muted mb-5">
                  Deploy intelligent AI agents that work 24/7—handling customer
                  interactions, managing tasks, and keeping your operations
                  running seamlessly around the clock.
                </p>
                <Button
                  as={Link}
                  to="/register"
                  variant="primary"
                  className="me-2"
                >
                  Get Started for Free
                </Button>
                <Button variant="outline-dark" onClick={openDemoModal}>
                  Schedule Demo
                </Button>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Partners Section */}
        <section className="py-4 bg-light">
          <Container>
            <h6 className="text-muted text-center mb-4">
              Empowering Countless Businesses Worldwide
            </h6>
          </Container>
          <div className="logo-slider">
            <div className="logos-slide">
              {duplicatedLogos.map((logo, index) => (
                <img key={index} src={logo.src} alt={logo.alt} />
              ))}
            </div>
          </div>
        </section>

        {/* Transform Interactions Section */}
        <section className="section-padding bg-white">
          <Container>
            <Row className="align-items-center">
              <Col lg={6}>
                <img
                  src="https://www.cloudrep.ai/wp-content/uploads/2025/03/OAIR-Active-Communication-Channels.png"
                  className="img-fluid rounded-3"
                  alt="Dashboard UI"
                />
              </Col>
              <Col lg={6} className="ps-lg-5 mt-4 mt-lg-0">
                <h2 className="section-title">
                  Transform Your{" "}
                  <span className="highlight">Customer Interactions</span>
                </h2>
                <p className="text-muted mb-5">
                  Quickly build custom Agents, hire ready-to-use Agents from our
                  Marketplace, or upgrade your existing Agents with
                  pre-configured jobs.
                </p>
                <Row>
                  <Col md={6} className="mb-4 d-flex">
                    <MicFill className="feature-icon me-3 flex-shrink-0" />
                    <div>
                      <h5>Live Voice Agents</h5>
                      <p className="text-muted small">
                        Deploy intelligent virtual assistants that comprehend
                        and empathetically respond to human speech.
                      </p>
                    </div>
                  </Col>
                  <Col md={6} className="mb-4 d-flex">
                    <ChatDotsFill className="feature-icon me-3 flex-shrink-0" />
                    <div>
                      <h5>Live Chat & SMS</h5>
                      <p className="text-muted small">
                        Implement conversational AI to manage real-time chats
                        across multiple platforms.
                      </p>
                    </div>
                  </Col>
                  <Col md={6} className="mb-4 d-flex">
                    <GraphUpArrow className="feature-icon me-3 flex-shrink-0" />
                    <div>
                      <h5>AI Sales & Marketing</h5>
                      <p className="text-muted small">
                        Utilize AI to engage, qualify, and nurture leads,
                        automating sales processes.
                      </p>
                    </div>
                  </Col>
                  <Col md={6} className="mb-4 d-flex">
                    <Headset className="feature-icon me-3 flex-shrink-0" />
                    <div>
                      <h5>AI Agent Assist</h5>
                      <p className="text-muted small">
                        Enhance human agent performance with AI tools offering
                        real-time insights.
                      </p>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Live Demo Section */}
        <section className="section-padding bg-light">
          <Container>
            <div className="text-center mb-5">
              <h2 className="section-title">
                Try Our Live <span className="highlight">AI Voice Agent</span>{" "}
                Demo
              </h2>
              <p className="text-muted">
                Please select which type of call you would like to receive, fill
                out the form and our Agent will give you a call.
              </p>
            </div>
            <Row className="align-items-center">
              <Col lg={4}>
                <div className="live-demo-form">
                  <h4 className="mb-4">Receive a live call from our agent</h4>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Control type="text" placeholder="Name" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Control type="email" placeholder="Email" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Control type="tel" placeholder="123-456-7890" />
                    </Form.Group>
                    <div className="d-grid">
                      <Button type="submit" variant="primary">
                        Get a Call
                      </Button>
                    </div>
                  </Form>
                </div>
              </Col>
              <Col lg={8} className="ps-lg-5 mt-4 mt-lg-0">
                <Row xs={2} md={3} className="g-4">
                  {agentTypes.map((agent) => {
                    const AgentIcon = agent.icon;
                    // REMOVED: The logic that checked for an active state
                    return (
                      <Col key={agent.name}>
                        {/* CHANGED: Removed the onClick and the conditional className */}
                        <div className="agent-type-card">
                          <AgentIcon className="icon" />
                          <span>{agent.name}</span>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Knowledge Base Section */}
        <section className="section-padding bg-white">
          <Container>
            <Row className="align-items-center">
              <Col lg={6}>
                <h2 className="section-title">
                  Simple <span className="highlight">Knowledge Base</span> Sync
                  Technology
                </h2>
                <p className="text-muted mb-5">
                  At EmployAI, our simplified knowledge base sync serves as the
                  cornerstone for training all AI agents, ensuring rapid
                  deployment and consistent performance across your
                  organization.
                </p>
                <Row>
                  <Col md={6}>
                    <h3 className="stat-number">70%</h3>
                    <h5>Accelerate Deployment</h5>
                    <p className="text-muted">
                      By centralizing your company's information, our platform
                      reduces the time required to train and deploy AI agents.
                    </p>
                  </Col>
                  <Col md={6}>
                    <h3 className="stat-number">47%</h3>
                    <h5>Enhance Consistency</h5>
                    <p className="text-muted">
                      A unified knowledge base minimizes discrepancies and
                      ensures that all AI agents operate with the same
                      up-to-date information.
                    </p>
                  </Col>
                </Row>
              </Col>
              <Col lg={6} className="mt-4 mt-lg-0">
                <img
                  src="https://www.cloudrep.ai/wp-content/uploads/2025/02/OAir-2.png"
                  className="img-fluid rounded-3"
                  alt="Agent Settings UI"
                />
              </Col>
            </Row>
          </Container>
        </section>

        {/* FAQ Section */}
        <section className="section-padding bg-light">
          <Container>
            <Row>
              <Col lg={4}>
                <h2 className="section-title">Frequently asked questions</h2>
                <p className="text-muted">
                  Couldn't find what you looking for? Write to us at{" "}
                  <a href="mailto:sales@EmployAI.com">sales@EmployAI.com</a>
                </p>
              </Col>
              <Col lg={8}>
                <Accordion defaultActiveKey="0" className="faq-accordion">
                  {faqData.map((faq) => (
                    <Accordion.Item
                      eventKey={faq.eventKey}
                      key={faq.eventKey}
                      className="mb-2"
                    >
                      <Accordion.Header>{faq.title}</Accordion.Header>
                      <Accordion.Body className="text-muted">
                        {faq.body}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Final CTA */}
        <section className="section-padding bg-white text-center">
          <Container>
            <h2 className="section-title">
              Time to hire your{" "}
              <span className="highlight">AI-Powered workforce</span>
            </h2>
            <p className="text-muted mb-4">
              Upgrade your business operations with EmployAI.
            </p>
            <Button as={Link} to="/register" variant="primary" className="me-2">
              Get Started for Free
            </Button>
            <Button variant="outline-dark" onClick={openDemoModal}>
              Schedule Demo
            </Button>
          </Container>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <Container>
          <Row className="mb-5">
            <Col lg={4} className="mb-4 mb-lg-0">
              <div className="d-flex align-items-center fs-4 mb-3">
                <Cpu className="me-2" />
                <span className="navbar-brand">EmployAI</span>
              </div>
              <p>
                Unlock the power of automated customer interactions with
                EmployAI. Get started for free today and experience seamless
                communication, increased efficiency, and real-time results.
              </p>
            </Col>
            <Col lg={2} xs={6}>
              <h5>Solutions</h5>
              <Nav className="flex-column">
                <Nav.Link className="p-0 mb-2" href="#">
                  AI Voice Agents
                </Nav.Link>
                <Nav.Link className="p-0 mb-2" href="#">
                  Chats & Messaging
                </Nav.Link>
              </Nav>
            </Col>
            <Col lg={2} xs={6}>
              <h5>Platform</h5>
              <Nav className="flex-column">
                <Nav.Link className="p-0 mb-2" href="#">
                  AI Agent Manager
                </Nav.Link>
                <Nav.Link className="p-0 mb-2" href="#">
                  Voice Gateway
                </Nav.Link>
              </Nav>
            </Col>
            <Col lg={2} xs={6}>
              <h5>Resources</h5>
              <Nav className="flex-column">
                <Nav.Link className="p-0 mb-2" href="#">
                  Help Center
                </Nav.Link>
                <Nav.Link className="p-0 mb-2" href="#">
                  Success Stories
                </Nav.Link>
              </Nav>
            </Col>
            <Col lg={2} xs={6}>
              <h5>Company</h5>
              <Nav className="flex-column">
                <Nav.Link className="p-0 mb-2" href="#">
                  About EmployAI
                </Nav.Link>
                <Nav.Link className="p-0 mb-2" href="#">
                  Events
                </Nav.Link>
              </Nav>
            </Col>
          </Row>
          <hr style={{ borderColor: "#343a40" }} />
          <div className="d-md-flex justify-content-between pt-3">
            <p className="mb-2 mb-md-0">
              © {new Date().getFullYear()} EmployAI. All rights reserved.
            </p>
            <div>
              <a href="#" className="me-3">
                Terms of Service
              </a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </Container>
      </footer>

      {/* Schedule Demo Modal */}
      <Modal
        show={showDemoModal}
        onHide={() => setShowDemoModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Schedule a Demo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {submitMessage && <Alert variant="success">{submitMessage}</Alert>}
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form onSubmit={handleDemoSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="FirstName"
                    value={demoFormData.FirstName}
                    onChange={handleDemoFormChange}
                    required
                    placeholder="Enter your first name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="LastName"
                    value={demoFormData.LastName}
                    onChange={handleDemoFormChange}
                    required
                    placeholder="Enter your last name"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email Address *</Form.Label>
              <Form.Control
                type="email"
                name="Email"
                value={demoFormData.Email}
                onChange={handleDemoFormChange}
                required
                placeholder="Enter your email address"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="Appointment_Date"
                    value={demoFormData.Appointment_Date}
                    onChange={handleDemoFormChange}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Preferred Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="Appointment_Time"
                    value={demoFormData.Appointment_Time}
                    onChange={handleDemoFormChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
              <Button
                variant="secondary"
                onClick={() => setShowDemoModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Demo"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default LandingPage;
